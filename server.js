// server.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const routes = require('./routes');
const cors = require('cors');
const { WebClient } = require('@slack/web-api');
const { google } = require('googleapis');

const app = express();
const PORT = 3000;

app.use(express.json());

// CORSを有効化
app.use(cors());

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

const SLACK_CHANNELS = {
  '101': 'C08FKSABU9X',
  '102': 'C08FKSABU9X',
  '103': 'C08FKSABU9X',
  '104': 'C08FKSABU9X',
  '105': 'C08FKSABU9X',
  '106': 'C08FKSABU9X',
  '107': 'C08FKSABU9X',
  '108': 'C08FKSABU9X',
  '109': 'C08FKSABU9X',
  '110': 'C08FKSABU9X',
  '111': 'C08FKSABU9X',
  '112': 'C08FKSABU9X',
  '201': 'C08FKSABU9X',
  '202': 'C08FKSABU9X',
  '203': 'C08FKSABU9X',
  '204': 'C08FKSABU9X',
  '205': 'C08FKSABU9X',
  '206': 'C08FKSABU9X',
  '207': 'C08FKSABU9X',
  '208': 'C08FKSABU9X',
  '209': 'C08FKSABU9X',
  '210': 'C08FKSABU9X',
  '211': 'C08FKSABU9X',
  '212': 'C08FKSABU9X',
  '213': 'C08FKSABU9X',
  '214': 'C08FKSABU9X',
  '221': 'C08FKSABU9X',
  '222': 'C08FKSABU9X',
  '223': 'C08FKSABU9X',
  '224': 'C08FKSABU9X',
  '225': 'C08FKSABU9X',
  '226': 'C08FKSABU9X',
  '301': 'C08FKSABU9X',
  '302': 'C08FKSABU9X',
  '303': 'C08FKSABU9X',
  '304': 'C08FKSABU9X',
  '305': 'C08FKSABU9X',
  '306': 'C08FKSABU9X',
  '307': 'C08FKSABU9X',
  '308': 'C08FKSABU9X',
  '309': 'C08FKSABU9X',
  '310': 'C08FKSABU9X',
  '311': 'C08FKSABU9X',
  '312': 'C08FKSABU9X',
  '313': 'C08FKSABU9X',
  '314': 'C08FKSABU9X',
  '315': 'C08FKSABU9X',
  '316': 'C08FKSABU9X'
};

// 教室の空き状況を管理するデータ構造
const classrooms = {
  '101': { available: true, teacher: '田中先生' },
  '102': { available: true, teacher: '佐藤先生' },
  '103': { available: true, teacher: '鈴木先生' },
  '104': { available: true, teacher: '高橋先生' },
  '105': { available: true, teacher: '伊藤先生' },
  '106': { available: true, teacher: '渡辺先生' },
  '107': { available: true, teacher: '山本先生' },
  '108': { available: true, teacher: '中村先生' },
  '109': { available: true, teacher: '小林先生' },
  '110': { available: true, teacher: '加藤先生' },
  '111': { available: true, teacher: '吉田先生' },
  '112': { available: true, teacher: '山田先生' },
  '201': { available: true, teacher: '佐々木先生' },
  '202': { available: true, teacher: '清水先生' },
  '203': { available: true, teacher: '松本先生' },
  '204': { available: true, teacher: '井上先生' },
  '205': { available: true, teacher: '木村先生' },
  '206': { available: true, teacher: '林先生' },
  '207': { available: true, teacher: '斉藤先生' },
  '208': { available: true, teacher: '山口先生' },
  '209': { available: true, teacher: '森先生' },
  '210': { available: true, teacher: '池田先生' },
  '211': { available: true, teacher: '橋本先生' },
  '212': { available: true, teacher: '阿部先生' },
  '213': { available: true, teacher: '石川先生' },
  '214': { available: true, teacher: '山崎先生' },
  '221': { available: true, teacher: '中島先生' },
  '222': { available: true, teacher: '小川先生' },
  '223': { available: true, teacher: '前田先生' },
  '224': { available: true, teacher: '藤田先生' },
  '225': { available: true, teacher: '岡田先生' },
  '226': { available: true, teacher: '後藤先生' },
  '301': { available: true, teacher: '長谷川先生' },
  '302': { available: true, teacher: '村上先生' },
  '303': { available: true, teacher: '近藤先生' },
  '304': { available: true, teacher: '石井先生' },
  '305': { available: true, teacher: '高木先生' },
  '306': { available: true, teacher: '安藤先生' },
  '307': { available: true, teacher: '三浦先生' },
  '308': { available: true, teacher: '藤井先生' },
  '309': { available: true, teacher: '西村先生' },
  '310': { available: true, teacher: '福田先生' },
  '311': { available: true, teacher: '太田先生' },
  '312': { available: true, teacher: '谷口先生' },
  '313': { available: true, teacher: '中野先生' },
  '314': { available: true, teacher: '小野先生' },
  '315': { available: true, teacher: '田村先生' },
  '316': { available: true, teacher: '竹内先生' }
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
  const { date, time } = req.query;
  const reservations = loadReservations();

  const classroomsStatus = Object.keys(classrooms).reduce((status, room) => {
    const isReserved = reservations.some(r => {
      return (
        r.room === room &&
        r.date === date &&
        time >= r.startTime &&
        time < r.endTime
      );
    });

    status[room] = {
      available: !isReserved
    };
    return status;
  }, {});

  res.status(200).json(classroomsStatus);
});

// 予約データを取得するエンドポイント
app.get('/admin/reservations', (req, res) => {
  const reservations = loadReservations();
  res.status(200).json(reservations);
});

// 環境変数からGoogle APIの認証情報を取得するように修正
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function updateSpreadsheet(reservations) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const spreadsheetId = '1_MAdFa8aaQ5nHFg_6dkBVDHGqctu4flPDl-jfPRm6XY'; // 正しいスプレッドシートIDを設定

  const sheetRequests = {};

  reservations.forEach(reservation => {
    const { room, user, date, startTime, endTime, purpose } = reservation;

    if (!sheetRequests[room]) {
      sheetRequests[room] = [];
    }

    sheetRequests[room].push([user, date, startTime, endTime, purpose || '未指定']);
  });

  for (const [room, rows] of Object.entries(sheetRequests)) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: room
                }
              }
            }
          ]
        }
      });
    } catch (error) {
      if (!error.message.includes('already exists')) {
        console.error(`シート作成エラー: ${room}`, error);
        continue;
      }
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${room}!A1`,
      valueInputOption: 'RAW',
      resource: {
        values: [
          ['予約者', '日付', '開始時間', '終了時間', '用途'],
          ...rows
        ]
      }
    });
  }
}

// 予約完了画面の静的ファイルを提供
app.use('/confirmation.html', express.static(path.join(__dirname, 'public', 'confirmation.html')));

// 教室予約のPOSTエンドポイント
app.post('/reserve', async (req, res) => {
  const { room, user, date, startTime, endTime, purpose } = req.body;

  console.log('リクエストボディ:', req.body); // デバッグ用ログ

  // 必須フィールドのバリデーション
  const missingFields = [];
  if (!room) missingFields.push('room');
  if (!user || typeof user !== 'string' || user.trim() === '') {
    missingFields.push('user');
  }
  if (!date) missingFields.push('date');
  if (!startTime) missingFields.push('startTime');
  if (!endTime) missingFields.push('endTime');
  if (!purpose) missingFields.push('purpose');

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

  reservations.push({ room, user, date, startTime, endTime, purpose });
  saveReservations(reservations);

  try {
    await slackClient.chat.postMessage({
      channel: SLACK_CHANNELS[room],
      text: `📢 *教室予約通知*
👤 代表者名: ${user}
🏢 団体名: ${req.body.name || '未指定'}
🏫 教室: ${room}
📅 日付: ${date}
🕒 時間: ${startTime} - ${endTime}
🎯 用途: ${purpose}`
    });

    // スプレッドシートを更新
    await updateSpreadsheet(reservations);

    classrooms[room].available = false;

    // 予約完了画面にリダイレクト
    res.redirect(`/confirmation.html?room=${encodeURIComponent(room)}&user=${encodeURIComponent(user)}&date=${encodeURIComponent(date)}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&purpose=${encodeURIComponent(purpose)}`);
  } catch (error) {
    console.error('Slack通知エラー詳細:', error.data || error.message);
    res.status(500).json({ message: 'Slack通知に失敗しました' });
  }
});

// 教室検索のエンドポイント
app.post('/search', (req, res) => {
  const { date, time, location, roomName } = req.body;
  const reservations = loadReservations();

  // 条件に基づいて教室をフィルタリング
  const filteredRooms = Object.keys(classrooms).filter(room => {
    const isLocationMatch = !location || room.startsWith(location[0]);
    const isNameMatch = !roomName || room.includes(roomName);
    const isAvailable = !reservations.some(r => r.room === room && r.date === date && r.time === time);
    return isLocationMatch && isNameMatch && isAvailable;
  }).map(room => ({
    name: room,
    available: true
  }));

  res.status(200).json(filteredRooms);
});

// 管理者ページの静的ファイルを提供
app.use('/admin.html', express.static(path.join(__dirname, 'public', 'admin.html')));

// 予約画面の静的ファイルを提供
app.use('/reservation.html', express.static(path.join(__dirname, 'public', 'reservation.html')));

// ルーティングを適用
app.use('/', routes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 教室予約サーバー起動中 → http://0.0.0.0:${PORT}`);
});