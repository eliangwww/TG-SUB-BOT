const BOT_TOKEN = '修改为自己的机器人令牌';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (request.method === 'GET' && url.pathname === '/') {
      await setWebhook(request.url);
      return new Response('机器人已启动', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleTelegramWebhook(request, env);
    }
    
    return new Response('Bot Running', { status: 200 });
  }
};

async function handleTelegramWebhook(request, env) {
  try {
    const update = await request.json();
    
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const messageText = update.message.text;
      
      if (messageText.startsWith('/start')) {
        await sendMessage(chatId, 
          '🤖 流量查询机器人\n\n' +
          '发送订阅链接即可查询流量信息'
        );
      } else if (messageText.startsWith('http://') || messageText.startsWith('https://')) {
        await processSubscriptionLink(chatId, messageText);
      } else {
        await sendMessage(chatId, '❌ 请发送有效链接地址');
      }
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    return new Response('Error', { status: 500 });
  }
}

async function processSubscriptionLink(chatId, subscribeUrl) {
  try {
    const loadingMsg = await sendMessage(chatId, '⏳ 查询中...');
    const loadingMsgId = loadingMsg.ok ? (await loadingMsg.json()).result.message_id : null;
    
    const queryUrl = `https://9.91ssvip.me/${subscribeUrl.trim()}`;
    
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://9.91ssvip.me/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin'
      }
    });
    
    const responseText = await response.text();
    
    await sendMessage(chatId, responseText);
    
    if (loadingMsgId) {
      await deleteMessage(chatId, loadingMsgId);
    }
    
  } catch (error) {
    await sendMessage(chatId, '查询失败');
  }
}

async function sendMessage(chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
  return response;
}

async function setWebhook(requestUrl) {
  try {
    const baseUrl = new URL(requestUrl).origin;
    const webhookUrl = `${baseUrl}/webhook`;
    
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: webhookUrl,
        allowed_updates: ["message"]
      })
    });
  } catch (error) {
    
  }
}

async function deleteMessage(chatId, messageId) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId
    })
  });
}
