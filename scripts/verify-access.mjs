import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const origin = process.env.O2O_TEST_URL || 'http://127.0.0.1:5173/';
const errors = [];
console.log('Starting access verification');
const features = ['project-list', 'members', 'stats', 'users', 'roles', 'projects'];
const operations = features.flatMap(f => [`${f}:write`, `${f}:export`, `${f}:export-log`]);
const fixture = {
  units: [{ id: 1, name: 'A', enabled: true }, { id: 2, name: 'B', enabled: true }, { id: 3, name: 'Disabled', enabled: false }],
  roles: [
    { id: 1, name: 'Admin', unit: 'A', enabled: true, permissions: features, operationPermissions: operations },
    { id: 2, name: 'EditorA', unit: 'A', enabled: true, permissions: features, operationPermissions: operations },
    { id: 3, name: 'ReaderB', unit: 'B', enabled: true, permissions: ['project-list', 'members', 'stats'], operationPermissions: [] },
    { id: 4, name: 'Disabled role', unit: 'A', enabled: false, permissions: features, operationPermissions: operations },
  ],
  users: [
    { id: 1, name: 'Admin', email: 'admin@gmail.com', enabled: true, assignments: [{ unit: 'A', role: 1 }] },
    { id: 2, name: 'AB user', email: 'ab@gmail.com', enabled: true, assignments: [{ unit: 'A', role: 2 }, { unit: 'B', role: 3 }] },
    { id: 3, name: 'B only', email: 'b@gmail.com', enabled: true, assignments: [{ unit: 'B', role: 3 }] },
    { id: 4, name: 'Disabled user', email: 'off@gmail.com', enabled: false, assignments: [{ unit: 'A', role: 2 }] },
    { id: 5, name: 'Disabled role user', email: 'offrole@gmail.com', enabled: true, assignments: [{ unit: 'A', role: 4 }] },
  ],
};
const projectFixture = ['A', 'B'].map((unit, i) => ({ id: 10 + i, name: `Project${unit}`, displayName: `Project${unit}`, unit, enabled: true, permanent: true, created: '2026/10/20', updated: '2026/10/20', start: '2026-10-20', end: '2026-10-20', email: true, phone: true }));
async function newPage(userId, unitId = 1, data = fixture) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin);
  await page.evaluate(({ fixture, projectFixture, userId, unitId }) => {
    localStorage.setItem('o2o-system', JSON.stringify(fixture));
    localStorage.setItem('o2o-projects', JSON.stringify(projectFixture));
    sessionStorage.setItem('o2o-demo-session', JSON.stringify(userId ? { authenticated: true, userId, unitId } : { authenticated: false }));
  }, { fixture: data, projectFixture, userId, unitId });
  await navigate(page, 'home');
  return page;
}
async function navigate(page, route) {
  await page.goto(`${origin}?verify=${Math.random()}#${route}`);
}
async function openNew(page) {
  await page.locator('[data-action="sys-new"]').click();
  await page.locator('#system-form').waitFor();
}
async function allUnits(page) {
  await page.locator('#system-filter select[name="unit"]').selectOption('all');
  await page.locator('#system-filter').evaluate(form => form.requestSubmit());
}
async function cancel(page) {
  await page.locator('[data-action="sys-cancel"]').first().click();
}
async function updateElsewhere(page, change) {
  const tab = await page.context().newPage();
  await tab.goto(origin);
  await tab.evaluate(change);
  await tab.close();
}
try {
  const admin = await newPage(1);
  for (const route of ['projects', 'system/users', 'system/roles']) {
    await navigate(admin, route);
    const select = admin.locator(route === 'projects' ? '#project-unit' : '#system-filter select[name="unit"]');
    assert.equal(await select.inputValue(), 'A');
    await select.selectOption('all');
    if (route !== 'projects') await admin.locator('#system-filter').evaluate(f => f.requestSubmit());
    await admin.waitForTimeout(50);
    assert.match(await admin.locator('tbody').innerText(), route === 'projects' ? /ProjectB/ : route === 'system/users' ? /B only/ : /ReaderB/);
  }
  for (const unit of ['A', 'B', 'all']) {
    await admin.locator('#system-filter select[name="unit"]').selectOption(unit);
    await admin.locator('#system-filter').evaluate(form => form.requestSubmit());
    const row = admin.locator('tr').filter({ has: admin.locator('[data-action="sys-edit"][data-id="1"]') });
    assert.match(await row.innerText(), /Admin/);
    assert.match(await row.innerText(), /全部單位/);
  }
  console.log('PASS: built-in admin role remains visible in A/B/all role filters');
  await admin.locator('summary.avatar').click();
  assert.equal(await admin.locator('summary.avatar').innerText(), 'C');
  await admin.locator('[data-action="switch-unit"]').click();
  await admin.waitForURL('**#select-unit');
  await admin.locator('[data-unit-id="2"]').click();
  await navigate(admin, 'projects');
  assert.equal(await admin.locator('#project-unit').inputValue(), 'B');
  await admin.locator('summary.avatar').click();
  await admin.locator('[data-action="logout"]').click();
  await admin.waitForURL('**#login');
  await navigate(admin, 'system/users');
  await admin.waitForURL('**#login');
  console.log('PASS: admin defaults, all scopes, account switch and logout');

  const user = await newPage(2);
  for (const route of ['projects', 'system/users', 'system/roles']) {
    await navigate(user, route);
    const select = user.locator(route === 'projects' ? '#project-unit' : '#system-filter select[name="unit"]');
    assert.deepEqual(await select.locator('option').evaluateAll(nodes => nodes.map(n => n.value)), ['A']);
    assert.doesNotMatch(await user.locator('tbody').innerText(), /ProjectB|B only|ReaderB/);
    if (route === 'system/roles') {
      await user.locator('tbody').getByText('Admin', { exact: true }).waitFor();
      assert.equal(await user.locator('[data-action="sys-edit"][data-id="1"]').count(), 0);
    }
  }
  await navigate(user, 'edit/11');
  await user.getByRole('heading', { name: '無法存取' }).waitFor();
  await navigate(user, 'home');
  await user.locator('summary.avatar').click();
  await user.locator('[data-action="switch-unit"]').click();
  await user.locator('[data-unit-id="2"]').click();
  await navigate(user, 'projects');
  assert.equal(await user.locator('#project-unit').inputValue(), 'B');
  assert.equal(await user.locator('[data-action="new"]:visible').count(), 0);
  assert.equal(await user.locator('[data-action="edit-11"]:visible').count(), 0);
  assert.equal(await user.locator('a[href="#system/users"]:visible').count(), 0);
  await navigate(user, 'new');
  await user.getByRole('heading', { name: '無法存取' }).waitFor();
  await navigate(user, 'members/11');
  assert.equal(await user.locator('[data-action="export"]:visible').count(), 0);
  assert.equal(await user.locator('[data-action="export-log"]:visible').count(), 0);
  await user.evaluate(() => {
    for (const action of ['export', 'export-log']) { const button = document.createElement('button'); button.dataset.action = action; document.querySelector('#app').append(button); button.click(); }
  });
  await user.locator('.el-alert').filter({ hasText: '您沒有此功能的操作權限' }).waitFor();
  await navigate(user, 'home');
  await user.evaluate(() => {
    for (const action of ['tab-basic', 'copy-current', 'report-query']) {
      const button = document.createElement('button'); button.dataset.action = action; document.querySelector('#app').append(button); button.click(); button.remove();
    }
  });
  await user.locator('.el-alert--error').waitFor();
  assert.equal(await user.locator('#project-form, #member-rows').count(), 0);
  console.log('PASS: single-unit scope, role-specific menus, URL and export restrictions');

  const manage = await newPage(1);
  await navigate(manage, 'system/users');
  await openNew(manage);
  assert.match(await manage.locator('#assignments-label').innerText(), /單位與角色/);
  assert.equal(await manage.locator('[name="assignment-unit"] option[value="Disabled"]').count(), 0);
  assert.equal(await manage.locator('[name="assignment-role"] option[value="4"]').count(), 0);
  await manage.locator('#user-name').fill('Duplicate');
  await manage.locator('#user-email').fill(' AB@GMAIL.COM ');
  await manage.locator('#system-form').evaluate(f => f.requestSubmit());
  await manage.locator('#error-email').filter({ hasText: '此 Email 已存在' }).waitFor();
  await manage.locator('[data-action="sys-cancel"]').first().click();
  await manage.locator('[data-action="sys-edit"][data-id="2"]').click();
  await manage.locator('#user-name').fill('Changed name');
  await manage.locator('#user-email').fill('fixed@gmail.com');
  await manage.locator('#system-form').evaluate(f => f.requestSubmit());
  await manage.locator('#system-modal').waitFor({ state: 'detached' });
  assert.equal(await manage.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).users.find(u => u.id === 2).email), 'fixed@gmail.com');
  await navigate(manage, 'system/projects');
  await openNew(manage);
  await manage.locator('#unit-name').fill('a');
  await manage.locator('#system-form').evaluate(f => f.requestSubmit());
  await manage.locator('#error-name').filter({ hasText: '單位名稱已存在' }).waitFor();
  await manage.locator('[data-action="sys-cancel"]').first().click();
  await manage.locator('[data-action="sys-edit"][data-id="1"]').click();
  await manage.locator('#unit-name').fill('Renamed A');
  await manage.locator('#system-form').evaluate(f => f.requestSubmit());
  await manage.locator('#system-modal').waitFor({ state: 'detached' });
  const stored = await manage.evaluate(() => ({ projects: JSON.parse(localStorage.getItem('o2o-projects')), system: JSON.parse(localStorage.getItem('o2o-system')) }));
  assert.equal(stored.projects[0].unit, 'Renamed A');
  assert.equal(stored.system.roles[1].unit, 'Renamed A');
  assert.equal(stored.system.users[1].assignments[0].unit, 'Renamed A');
  await navigate(manage, 'system/roles');
  await manage.locator('#system-filter select[name="unit"]').selectOption('all');
  await manage.locator('#system-filter').evaluate(form => form.requestSubmit());
  await manage.locator('[data-action="sys-edit"][data-id="1"]').click();
  await manage.locator('#role-name').fill('Renamed admin');
  assert.equal(await manage.locator('#role-unit').isDisabled(), true);
  assert.equal(await manage.locator('#role-unit').inputValue(), '*');
  await manage.locator('#system-form').evaluate(f => f.requestSubmit());
  await manage.locator('#system-modal').waitFor({ state: 'detached' });
  assert.equal(await manage.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).roles.find(r => r.id === 1).unit), '*');
  console.log('PASS: email uniqueness/edit, disabled choices, case-insensitive units, rename synchronization, editable built-in role');

  await navigate(manage, 'new');
  await manage.locator('[name="buid"]').fill('26');
  await manage.locator('[name="name"]').fill('New in selected unit');
  await manage.locator('#project-form').evaluate(form => form.requestSubmit());
  await manage.waitForURL('**#projects');
  assert.equal(await manage.evaluate(() => JSON.parse(localStorage.getItem('o2o-projects'))[0].unit), 'Renamed A');
  console.log('PASS: new projects inherit the selected unit');

  const login = await newPage(null);
  for (const email of ['unknown@gmail.com', 'off@gmail.com', 'offrole@gmail.com']) {
    await login.locator('#login-email').fill(email);
    await login.locator('[data-action="demo-login"]').click();
    await login.locator('.el-alert--error').waitFor();
    assert.equal(new URL(login.url()).hash, '#login');
  }
  await login.locator('#login-email').fill(' AB@GMAIL.COM ');
  await login.locator('[data-action="demo-login"]').click();
  await login.waitForURL('**#select-unit');
  await login.locator('.unit-button').first().waitFor();
  assert.equal(await login.locator('.unit-button').count(), 2);
  console.log('PASS: unknown/disabled login rejected, normalized email identity mapping');
  await login.locator('[data-unit-id="1"]').click();
  const otherTab = await login.context().newPage();
  await otherTab.goto(origin);
  await otherTab.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('o2o-system'));
    data.users.find(user => user.id === 2).enabled = false;
    localStorage.setItem('o2o-system', JSON.stringify(data));
  });
  await login.waitForURL('**#login');
  await login.locator('.el-alert--error').waitFor();
  assert.equal(await login.evaluate(() => JSON.parse(sessionStorage.getItem('o2o-demo-session')).authenticated), false);
  console.log('PASS: disabled users lose their existing session across tabs');

  const adminUsersData = structuredClone(fixture);
  adminUsersData.roles[0].name = '系統管理員';
  adminUsersData.users.push({ id: 7, name: '陳查理', email: 'charlie@gmail.com', enabled: true, assignments: [{ unit: '*', role: 1 }] });
  const adminUsers = await newPage(1, 1, adminUsersData);
  await navigate(adminUsers, 'system/users');
  for (const unit of ['A', 'B', 'all']) {
    await adminUsers.locator('#system-filter select[name="unit"]').selectOption(unit);
    await adminUsers.locator('#system-filter').evaluate(form => form.requestSubmit());
    const row = adminUsers.locator('tr').filter({ has: adminUsers.locator('[data-action="sys-edit"][data-id="7"]') });
    assert.equal(await row.locator('.user-unit').innerText(), '全部單位');
    assert.equal(await row.locator('.user-unit-role').innerText(), '系統管理員');
  }
  await adminUsers.locator('[data-action="sys-edit"][data-id="7"]').click();
  await adminUsers.locator('.el-switch').click();
  await adminUsers.locator('#system-form').evaluate(form => form.requestSubmit());
  const warning = adminUsers.locator('.el-message-box');
  await warning.getByText('使用者為系統管理員，確定要停用?', { exact: true }).waitFor();
  assert.equal(await warning.isVisible(), true);
  assert.equal(await adminUsers.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).users.find(user => user.id === 7).enabled), true);
  await warning.getByRole('button', { name: '取消', exact: true }).click();
  await warning.waitFor({ state: 'hidden' });
  await adminUsers.waitForFunction(() => document.querySelector('#system-form')?.dataset.confirming !== 'true');
  assert.equal(await adminUsers.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).users.find(user => user.id === 7).enabled), true);
  await adminUsers.locator('#system-form').evaluate(form => form.requestSubmit());
  await warning.getByText('使用者為系統管理員，確定要停用?', { exact: true }).waitFor();
  await warning.getByRole('button', { name: '確定', exact: true }).click();
  await adminUsers.locator('#system-modal').waitFor({ state: 'detached' });
  assert.equal(await adminUsers.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).users.find(user => user.id === 7).enabled), false);
  assert.equal(await adminUsers.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).roles.find(role => role.id === 1).enabled), true);
  const localManager = await newPage(2, 1, adminUsersData);
  await navigate(localManager, 'system/users');
  await localManager.locator('[data-action="sys-edit"][data-id="7"]').waitFor();
  console.log('PASS: global admins appear in every unit with labels; disabling an admin user requires cancel/confirm, role stays enabled');

  const rules = await newPage(1);
  const migrated = await rules.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')));
  assert.equal(migrated.roles[0].unit, '*');
  assert.deepEqual(migrated.users[0].assignments, [{ unit: '*', role: 1 }]);
  assert.equal(migrated.users.length, fixture.users.length);
  assert.equal(migrated.roles.length, fixture.roles.length);
  await navigate(rules, 'system/users');
  await openNew(rules);
  assert.deepEqual(await rules.locator('[name="assignment-role"] option').evaluateAll(nodes => nodes.map(n => n.value)), ['', '2']);
  await rules.locator('[name="assignment-unit"]').selectOption('*');
  assert.deepEqual(await rules.locator('[name="assignment-role"] option').evaluateAll(nodes => nodes.map(n => n.value)), ['', '1']);
  assert.equal(await rules.locator('[data-action="sys-assignment-add"]').isDisabled(), true);
  await rules.evaluate(() => {
    const button = document.createElement('button'); button.dataset.action = 'sys-assignment-add'; document.querySelector('#system-form').append(button); button.click(); button.remove();
  });
  assert.equal(await rules.locator('.assignment-row').count(), 1);
  await cancel(rules);
  await rules.locator('[data-action="sys-edit"][data-id="2"]').click();
  await rules.locator('[name="assignment-unit"]').first().selectOption('*');
  assert.equal(await rules.locator('[name="assignment-unit"]').first().inputValue(), 'A');
  await rules.locator('#error-assignments').filter({ hasText: '全部單位不可與其他指派並存' }).waitFor();
  // Bypass the change handler to exercise the independent submit validator.
  await rules.evaluate(() => {
    document.querySelector('[name="assignment-unit"]').value = '*';
    const select = document.querySelector('[name="assignment-role"]');
    select.add(new Option('Admin', '1', true, true));
    document.querySelector('#system-form').requestSubmit();
  });
  await rules.locator('#error-assignments').filter({ hasText: '全部單位不可與其他指派並存' }).waitFor();
  assert.equal(await rules.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).users[1].assignments.length), 2);
  await cancel(rules);
  // A forged individual-unit assignment may not use the built-in role.
  await openNew(rules);
  await rules.locator('#user-name').fill('Forged');
  await rules.locator('#user-email').fill('forged@gmail.com');
  await rules.evaluate(() => {
    const select = document.querySelector('[name="assignment-role"]'); select.add(new Option('Admin', '1', true, true));
    document.querySelector('#system-form').requestSubmit();
  });
  await rules.locator('#error-assignment-role-0').filter({ hasText: '角色不屬於所選單位' }).waitFor();
  await cancel(rules);
  await allUnits(rules);
  await rules.locator('[data-action="sys-edit"][data-id="1"]').click();
  await rules.locator('.el-switch').click();
  await rules.locator('#system-form').evaluate(form => form.requestSubmit());
  await rules.locator('#error-enabled').filter({ hasText: '至少需保留一位啟用的系統管理員' }).waitFor();
  await cancel(rules);
  await navigate(rules, 'system/roles');
  await openNew(rules);
  assert.equal(await rules.locator('#role-unit option[value="*"]').count(), 0);
  await rules.locator('#role-name').fill('Invalid global');
  await rules.locator('#role-unit').evaluate(select => select.add(new Option('All', '*', true, true)));
  await rules.locator('#system-form').evaluate(form => form.requestSubmit());
  await rules.locator('#error-unit').filter({ hasText: '一般角色必須' }).waitFor();
  await cancel(rules);
  await allUnits(rules);
  await rules.locator('[data-action="sys-edit"][data-id="1"]').click();
  await rules.locator('#role-name').fill('Not named Admin');
  await rules.locator('#system-form').evaluate(form => {
    form.querySelector('[name="enabled"]').value = 'false';
    form.querySelector('#role-unit').disabled = false;
    form.querySelector('#role-unit').add(new Option('A', 'A', true, true));
    form.querySelectorAll('input[type="checkbox"]').forEach(input => input.checked = false);
    form.requestSubmit();
  });
  await rules.locator('#system-modal').waitFor({ state: 'detached' });
  const fixedAdmin = await rules.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).roles.find(role => role.id === 1));
  assert.equal(fixedAdmin.unit, '*');
  assert.equal(fixedAdmin.enabled, true);
  assert.deepEqual(fixedAdmin.permissions, features);
  assert.equal(fixedAdmin.operationPermissions.length, 8);
  assert.equal(fixedAdmin.name, 'Not named Admin');
  console.log('PASS: exclusive global assignments, independent submit validation, fixed built-in identity, last-admin protection');

  // A disabled A remains manageable while this ordinary user can enter B.
  const unitManager = await newPage(2);
  await navigate(unitManager, 'system/projects');
  await unitManager.locator('[data-action="sys-edit"][data-id="1"]').click();
  await unitManager.locator('.el-switch').click();
  await unitManager.locator('#system-form').evaluate(form => form.requestSubmit());
  await unitManager.waitForURL('**#select-unit');
  await unitManager.locator('.unit-button').waitFor();
  assert.equal(await unitManager.locator('#system-modal').count(), 0);
  assert.equal(await unitManager.locator('.workspace').count(), 0);
  assert.deepEqual(await unitManager.locator('.unit-button').evaluateAll(nodes => nodes.map(node => node.dataset.unitId)), ['2']);
  await unitManager.reload();
  assert.equal(await unitManager.locator('[data-unit-id="1"]').count(), 0);
  await unitManager.locator('[data-unit-id="2"]').click();
  await navigate(unitManager, 'system/projects');
  await unitManager.locator('[data-action="sys-edit"][data-id="1"]').waitFor();
  await navigate(unitManager, 'edit/10');
  await unitManager.getByRole('heading', { name: '無法存取' }).waitFor();
  await navigate(unitManager, 'system/projects');
  await unitManager.locator('[data-action="sys-edit"][data-id="1"]').click();
  await unitManager.locator('.el-switch').click();
  await unitManager.locator('#system-form').evaluate(form => form.requestSubmit());
  await unitManager.locator('#system-modal').waitFor({ state: 'detached' });
  assert.equal(await unitManager.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).units[0].enabled), true);
  console.log('PASS: same-page unit disable revokes business access; non-admin can view and re-enable A from B');

  const readOnlyData = structuredClone(fixture);
  readOnlyData.units[0].enabled = false;
  readOnlyData.roles[1].operationPermissions = readOnlyData.roles[1].operationPermissions.filter(permission => permission !== 'projects:write');
  const readOnlyManager = await newPage(2, 2, readOnlyData);
  await navigate(readOnlyManager, 'system/projects');
  assert.match(await readOnlyManager.locator('tbody').innerText(), /A/);
  assert.equal(await readOnlyManager.locator('[data-action="sys-edit"]').count(), 0);
  await readOnlyManager.evaluate(() => {
    const button = document.createElement('button'); button.dataset.action = 'sys-edit'; button.dataset.id = '1'; document.querySelector('#app').append(button); button.click();
  });
  await readOnlyManager.locator('.el-alert--error').waitFor();
  assert.equal(await readOnlyManager.locator('#system-modal').count(), 0);
  assert.equal(await readOnlyManager.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).units[0].enabled), false);
  readOnlyData.roles[1].enabled = false;
  const noManager = await newPage(2, 2, readOnlyData);
  await navigate(noManager, 'system/projects');
  await noManager.getByRole('heading', { name: '無法存取' }).waitFor();
  console.log('PASS: management view/write are separate, disabled management roles grant nothing');

  const selfDisabled = await newPage(2);
  await navigate(selfDisabled, 'system/users');
  await selfDisabled.locator('[data-action="sys-edit"][data-id="2"]').click();
  await selfDisabled.locator('.el-switch').click();
  await selfDisabled.locator('#system-form').evaluate(form => form.requestSubmit());
  await selfDisabled.waitForURL('**#login');
  assert.equal(await selfDisabled.locator('#system-modal').count(), 0);
  assert.equal(await selfDisabled.locator('.workspace').count(), 0);
  const noUnitsData = structuredClone(fixture);
  noUnitsData.units.forEach(unit => unit.enabled = false);
  const noUnits = await newPage(2, 1, noUnitsData);
  await noUnits.waitForURL('**#login');
  await noUnits.locator('#login-email').fill('ab@gmail.com');
  await noUnits.locator('[data-action="demo-login"]').click();
  await noUnits.locator('.el-alert--error').waitFor();
  assert.equal(new URL(noUnits.url()).hash, '#login');
  console.log('PASS: same-page self-disable logs out; all-disabled units cannot be revived by login');

  const revoked = await newPage(2);
  await navigate(revoked, 'system/roles');
  await revoked.locator('[data-action="sys-edit"][data-id="2"]').click();
  await revoked.locator('.el-switch').click();
  await revoked.locator('#system-form').evaluate(form => form.requestSubmit());
  await revoked.waitForURL('**#select-unit');
  await revoked.locator('[data-unit-id="2"]').waitFor();
  assert.equal(await revoked.locator('#system-modal').count(), 0);
  await revoked.reload();
  await revoked.locator('[data-unit-id="2"]').waitFor();
  assert.equal(await revoked.locator('[data-unit-id="1"]').count(), 0);
  await revoked.locator('[data-unit-id="2"]').click();
  await navigate(revoked, 'members/11');
  await updateElsewhere(revoked, () => {
    const data = JSON.parse(localStorage.getItem('o2o-system'));
    data.roles.find(role => role.id === 3).enabled = false;
    localStorage.setItem('o2o-system', JSON.stringify(data));
  });
  await revoked.waitForURL('**#login');
  assert.equal(await revoked.locator('#member-rows').count(), 0);
  await revoked.locator('#login-email').fill('ab@gmail.com');
  await revoked.locator('[data-action="demo-login"]').click();
  await revoked.locator('.el-alert--error').waitFor();
  assert.equal(new URL(revoked.url()).hash, '#login');
  console.log('PASS: same-page role revocation, reload persistence, all-invalid logout and login rejection');

  const crossTab = await newPage(2);
  await navigate(crossTab, 'system/users');
  await crossTab.locator('[data-action="sys-edit"][data-id="2"]').click();
  await updateElsewhere(crossTab, () => {
    const data = JSON.parse(localStorage.getItem('o2o-system'));
    data.roles.find(role => role.id === 2).enabled = false;
    localStorage.setItem('o2o-system', JSON.stringify(data));
  });
  await crossTab.waitForURL('**#select-unit');
  await crossTab.locator('[data-unit-id="2"]').waitFor();
  assert.equal(await crossTab.locator('#system-modal').count(), 0);
  assert.equal(await crossTab.locator('#user-email').count(), 0);
  console.log('PASS: cross-tab partial revocation closes editor and clears sensitive content');

  const invalidData = structuredClone(fixture);
  invalidData.roles.push({ id: 5, name: 'Old global', unit: '*', enabled: true, permissions: features, operationPermissions: operations });
  invalidData.users.push({ id: 6, name: 'Invalid global', email: 'global@gmail.com', enabled: true, assignments: [{ unit: '*', role: 5 }] });
  invalidData.users[0].assignments.push({ unit: 'B', role: 3 });
  const invalid = await newPage(6, 1, invalidData);
  await invalid.waitForURL('**#login');
  await invalid.locator('.el-alert--error').waitFor();
  const preserved = await invalid.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')));
  assert.equal(preserved.roles.find(role => role.id === 5).unit, '*');
  assert.deepEqual(preserved.users[0].assignments, [{ unit: '*', role: 1 }]);
  assert.deepEqual(preserved.users.find(user => user.id === 6).assignments, [{ unit: '*', role: 5 }]);
  assert.equal(preserved.users.length, invalidData.users.length);
  await invalid.locator('#login-email').fill('admin@gmail.com');
  await invalid.locator('[data-action="demo-login"]').click();
  await invalid.locator('[data-unit-id="1"]').click();
  await navigate(invalid, 'system/roles');
  await allUnits(invalid);
  await invalid.locator('tbody').getByText('失效：一般角色不可屬於全部單位，請修正。').waitFor();
  await invalid.locator('[data-action="sys-edit"][data-id="5"]').click();
  await invalid.locator('#role-unit').selectOption('A');
  await invalid.locator('#system-form').evaluate(form => form.requestSubmit());
  await invalid.locator('#system-modal').waitFor({ state: 'detached' });
  assert.equal(await invalid.evaluate(() => JSON.parse(localStorage.getItem('o2o-system')).roles.find(role => role.id === 5).unit), 'A');
  console.log('PASS: legacy admin collapsed without resetting records; general global role grants no access');

  // A manager filtering B or all still creates in the unit selected on entry (A).
  const creation = await newPage(1);
  await navigate(creation, 'projects');
  for (const filter of ['all', 'B']) {
    await creation.locator('#project-unit').selectOption(filter);
    await creation.locator('[data-action="new"]').click();
    await creation.locator('[name="buid"]').fill('26');
    await creation.locator('[name="name"]').fill(`Created while filtering ${filter}`);
    await creation.locator('#project-form').evaluate(form => form.requestSubmit());
    await creation.waitForURL('**#projects');
    assert.equal(await creation.evaluate(() => JSON.parse(localStorage.getItem('o2o-projects'))[0].unit), 'A');
  }
  console.log('PASS: filtering all/other units never changes new-project ownership');
  await manage.setViewportSize({ width: 1440, height: 900 });
  await navigate(manage, 'home');
  await manage.locator('summary.avatar').click();
  await manage.screenshot({ path: `${process.env.TEMP}/o2o-account-desktop.png` });
  await manage.setViewportSize({ width: 390, height: 844 });
  await manage.screenshot({ path: `${process.env.TEMP}/o2o-account-mobile.png` });
  assert.equal(await manage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log('PASS: desktop/mobile capture, no runtime errors');
} finally {
  await browser.close();
}
