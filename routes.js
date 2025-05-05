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

// 各階の空き状況ページへのルートを追加
router.get('/floor1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'floor1.html'));
});

router.get('/floor2.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'floor2.html'));
});

router.get('/floor3.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'floor3.html'));
});

// 予約完了画面のルートを追加
router.get('/confirmation.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirmation.html'));
});

module.exports = router;