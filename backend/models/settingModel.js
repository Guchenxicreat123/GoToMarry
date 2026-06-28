const { getDatabase } = require('../config/database');

/**
 * 获取所有配置
 */
function getSettings() {
  const db = getDatabase();
  const result = db.exec('SELECT key, value FROM settings');
  
  const settings = {};
  if (result.length > 0) {
    result[0].values.forEach(row => {
      try {
        settings[row[0]] = JSON.parse(row[1]);
      } catch {
        settings[row[0]] = row[1];
      }
    });
  }
  
  return {
    weddingDate: settings.wedding_date?.date || '',
    brideName: settings.bride_name?.name || '',
    groomName: settings.groom_name?.name || '',
    budgetTotal: settings.budget_total?.total || 0
  };
}

/**
 * 更新配置
 */
function updateSettings(data) {
  const db = getDatabase();
  
  const fieldMap = {
    weddingDate: { key: 'wedding_date', value: (v) => JSON.stringify({ date: v }) },
    brideName: { key: 'bride_name', value: (v) => JSON.stringify({ name: v }) },
    groomName: { key: 'groom_name', value: (v) => JSON.stringify({ name: v }) },
    budgetTotal: { key: 'budget_total', value: (v) => JSON.stringify({ total: Number(v) }) }
  };

  for (const [key, config] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      db.run(`
        INSERT OR REPLACE INTO settings (key, value, updated_at) 
        VALUES (?, ?, datetime("now"))
      `, [config.key, config.value(data[key])]);
    }
  }

  return getSettings();
}

module.exports = {
  getSettings,
  updateSettings
};
