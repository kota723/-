const express = require('express');
const path = require('path');

const router = express.Router();

// ルートURLでindex.htmlを表示
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 管理者ページのルートを追加
router.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

module.exports = router;