const { google } = require('googleapis');
const fs = require('fs');

// 認証情報の読み込み
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const reservations = JSON.parse(fs.readFileSync('reservations.json'));

// Google Sheets APIの認証設定
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

async function updateReservations() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // スプレッドシートIDを指定
  const spreadsheetId = '1_MAdFa8aaQ5nHFg_6dkBVDHGqctu4flPDl-jfPRm6XY'; // スプレッドシートのIDをここに入力

  // 教室ごとにタブを作成し、データを追加
  const sheetRequests = {};

  reservations.forEach(reservation => {
    const { room, user, date, startTime, endTime, purpose } = reservation;

    if (!sheetRequests[room]) {
      sheetRequests[room] = [];
    }

    sheetRequests[room].push([user, date, startTime, endTime, purpose || '未指定']);
  });

  for (const [room, rows] of Object.entries(sheetRequests)) {
    // シートが存在しない場合は作成
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

    // データをシートに書き込む
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${room}!A1`,
      valueInputOption: 'RAW',
      resource: {
        values: [
          ['予約者', '日付', '開始時間', '終了時間', '用途'], // ヘッダー
          ...rows
        ]
      }
    });
  }

  console.log('スプレッドシートを更新しました！');
}

updateReservations().catch(console.error);