// server.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const routes = require('./routes');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());

// CORSを有効化
app.use(cors());

const SLACK_WEBHOOK_URLS = {
  '1A': process.env.SLACK_WEBHOOK_URL_1A,
  '2B': process.env.SLACK_WEBHOOK_URL_2B,
  '3C': process.env.SLACK_WEBHOOK_URL_3C
};

// 教室の空き状況を管理するデータ構造
const classrooms = {
  '1A': { available: true, teacher: '田中先生' },
  '2B': { available: true, teacher: '佐藤先生' },
  '3C': { available: true, teacher: '鈴木先生' }
};

const reservationsFilePath = path.join(__dirname, 'reservations.json');

// 予約データを読み込む関数
function loadReservations() {
  if (!fs.existsSync(reservationsFilePath)) {
    fs.writeFileSync(reservationsFilePath, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(reservationsFilePath));
}

// 予約データを保存する関数
function saveReservations(reservations) {
  fs.writeFileSync(reservationsFilePath, JSON.stringify(reservations, null, 2));
}

// 教室の空き状況を取得するエンドポイント
app.get('/classrooms', (req, res) => {
  res.status(200).json(classrooms);
});

// 予約データを取得するエンドポイント
app.get('/admin/reservations', (req, res) => {
  const reservations = loadReservations();
  res.status(200).json(reservations);
});

// 教室予約のPOSTエンドポイント
app.post('/reserve', async (req, res) => {
  const { room, user, date, startTime, endTime } = req.body;

  console.log('リクエストボディ:', req.body); // デバッグ用ログ

  // 必須フィールドのバリデーション
  const missingFields = [];
  if (!room) missingFields.push('room');
  if (!user) missingFields.push('user');
  if (!date) missingFields.push('date');
  if (!startTime) missingFields.push('startTime');
  if (!endTime) missingFields.push('endTime');

  if (missingFields.length > 0) {
    console.log('不足しているフィールド:', missingFields); // デバッグ用ログ
    return res.status(400).json({ message: `${missingFields.join(', ')} はすべて必須です` });
  }

  const reservations = loadReservations();

  // 予約データの重複を防ぐ
  const existingReservation = reservations.find(r => r.room === room && r.date === date && (
      (startTime >= r.startTime && startTime < r.endTime) ||
      (endTime > r.startTime && endTime <= r.endTime)
  ));

  if (existingReservation) {
      return res.status(400).json({ message: '同じ時間帯に既に予約があります' });
  }

  reservations.push({ room, user, date, startTime, endTime });
  saveReservations(reservations);

  if (!classrooms[room]?.available) {
    return res.status(400).json({ message: `${room} は現在予約できません` });
  }

  const message = {
    text: `📢 *教室予約通知*
👤 予約者: ${user}
🏫 教室: ${room}
📅 日付: ${date}
🕒 時間: ${startTime} - ${endTime}
👨‍🏫 担任: ${classrooms[room]?.teacher}`
  };

  // Slack通知のエラー処理を改善
  try {
    await axios.post(SLACK_WEBHOOK_URLS[room], message);
    classrooms[room].available = false; // 教室を予約済みに設定
    res.status(200).json({ message: '予約が完了しました！' });
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('Slack送信エラー:', error.response.data);
      res.status(500).json({ message: `Slack通知に失敗しました: ${error.response.data}` });
    } else {
      console.error('Slack送信エラー:', error.message);
      res.status(500).json({ message: 'Slack通知に失敗しました' });
    }
  }
});

// 管理者ページの静的ファイルを提供
app.use('/admin.html', express.static(path.join(__dirname, 'public', 'admin.html')));

// ルーティングを適用
app.use('/', routes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 教室予約サーバー起動中 → http://0.0.0.0:${PORT}`);
});