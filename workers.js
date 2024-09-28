// Constants
const IMAGE_API_URL = 'https://api.siliconflow.cn/v1/image/generations';
const PROCESS_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const DEFAULT_SIZE = '512x512';
const SIZE_REGEX = /^\d+x\d+$/;
const NON_ASCII_REGEX = /[^\x00-\x7F]/;

const ERROR_IMAGE_URLS = {
  '400': 'https://www.aisharenet.com/wp-content/uploads/2024/07/99dd797026b75ad.jpg',
  '401': 'https://www.aisharenet.com/wp-content/uploads/2024/07/99dd797026b75ad.jpg',
  '404': 'https://www.aisharenet.com/wp-content/uploads/2024/07/99dd797026b75ad.jpg',
  '429': 'https://www.aisharenet.com/wp-content/uploads/2024/07/99dd797026b75ad.jpg',
  '503': 'https://www.aisharenet.com/wp-content/uploads/2024/07/99dd797026b75ad.jpg',
  '504': 'https://www.aisharenet.com/wp-content/uploads/2024/07/99dd797026b75ad.jpg',
  'default': 'https://www.aisharenet.com/wp-content/uploads/2024/07/99dd797026b75ad.jpg'
};

// 计数器用于API密钥轮询
let counter = 0;

// 限流配置：单一访客60秒内最多5次请求
const rateLimit = {
  window: 120000, // 120秒
  limit: 5,       // 每个访客最多5个请求
  requests: {}    // 存储每个访客的请求记录，基于IP地址
};

// 获取下一个 API 密钥的函数
function getNextApiKey() {
  const keys = IMAGE_API_KEYS ? (IMAGE_API_KEYS.split(',') || []) : [];
  if (!keys || keys.length === 0) {
    throw new Error('No API keys available');
  }
  
  const key = keys[counter % keys.length];
  counter = (counter + 1) % keys.length;
  
  return key;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const clientIp = request.headers.get('CF-Connecting-IP');
    
    // 检查是否超出限流
    if (isRateLimited(clientIp)) {
      return await fetchAndReturnImage(ERROR_IMAGE_URLS['429']);
    }

    const url = new URL(request.url);
    
    if (url.pathname === '/gui/') {
      return new Response(getGuiPage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const id = url.searchParams.get('id');
    if (id) {
      const imageUrl = await getImageURLfromStore(id);
      if (imageUrl) {
        return await fetchAndReturnImage(imageUrl);
      }
    }

    const prompt = url.searchParams.get('prompt');

    if (!prompt) {
      return new Response(getUsageInstructions(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const { size, optimization } = parseRequestParams(request);
    const processedPrompt = await getProcessedPrompt(prompt, optimization);
    const imageUrl = await getImageUrl(processedPrompt, size);
    const imageId = await storeImageURL(imageUrl);
    if (imageId) {
      const currentUrl = new URL(request.url);
      currentUrl.searchParams.set('id', imageId);
      const newUrl = currentUrl.toString();
      return new Response(null, {
        status: 302,
        headers: { 'Location': newUrl }
      });
    }
    return await fetchAndReturnImage(imageUrl);
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return await fetchAndReturnImage(ERROR_IMAGE_URLS['default']);
  }
}

// 修改：检查是否超出限流的函数
function isRateLimited(clientIp) {
  const now = Date.now();
  const clientRequests = rateLimit.requests[clientIp] || [];
  
  // 移除过期的请求记录
  const validRequests = clientRequests.filter(timestamp => now - timestamp < rateLimit.window);
  
  if (validRequests.length >= rateLimit.limit) {
    return true; // 超出限流
  }
  
  // 添加新的请求记录
  validRequests.push(now);
  rateLimit.requests[clientIp] = validRequests;
  
  return false; // 未超出限流
}async function handleRequest(request) {
  try {
    const clientIp = request.headers.get('CF-Connecting-IP');
    
    // 检查是否超出限流
    if (isRateLimited(clientIp)) {
      return await fetchAndReturnImage(ERROR_IMAGE_URLS['429']);
    }

    const url = new URL(request.url);
    
    if (url.pathname === '/gui/') {
      return new Response(getGuiPage(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const id = url.searchParams.get('id');
    if (id) {
      const imageUrl = await getImageURLfromStore(id);
      if (imageUrl) {
        return await fetchAndReturnImage(imageUrl);
      }
    }

    const prompt = url.searchParams.get('prompt');

    if (!prompt) {
      return new Response(getUsageInstructions(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const { size, optimization } = parseRequestParams(request);
    const processedPrompt = await getProcessedPrompt(prompt, optimization);
    const imageUrl = await getImageUrl(processedPrompt, size);
    const imageId = await storeImageURL(imageUrl);
    if (imageId) {
      const currentUrl = new URL(request.url);
      currentUrl.searchParams.set('id', imageId);
      const newUrl = currentUrl.toString();
      return new Response(null, {
        status: 302,
        headers: { 'Location': newUrl }
      });
    }
    return await fetchAndReturnImage(imageUrl);
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return await fetchAndReturnImage(ERROR_IMAGE_URLS['default']);
  }
}

// 修改：检查是否超出限流的函数
function isRateLimited(clientIp) {
  const now = Date.now();
  const clientRequests = rateLimit.requests[clientIp] || [];
  
  // 移除过期的请求记录
  const validRequests = clientRequests.filter(timestamp => now - timestamp < rateLimit.window);
  
  if (validRequests.length >= rateLimit.limit) {
    return true; // 超出限流
  }
  
  // 添加新的请求记录
  validRequests.push(now);
  rateLimit.requests[clientIp] = validRequests;
  
  return false; // 未超出限流
}


function parseRequestParams(request) {
  const url = new URL(request.url);
  const size = url.searchParams.get('size') || DEFAULT_SIZE;
  const optimization = url.searchParams.get('optimization') === '1';

  if (!SIZE_REGEX.test(size)) {
    throw new Error('Invalid size parameter. Use format: widthxheight');
  }

  return { size, optimization };
}

async function getProcessedPrompt(prompt, optimization) {
  if (!NON_ASCII_REGEX.test(prompt) && !optimization) {
    return prompt;
  }
  return processPrompt(prompt, optimization);
}

async function getImageUrl(prompt, size) {
  const apiKey = getNextApiKey();
  try {
    const response = await fetch(IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell",
        prompt,
        image_size: size
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data?.images?.[0]?.url;

    if (!imageUrl) {
      throw new Error('Unexpected API response format');
    }

    return imageUrl;
  } catch (error) {
    console.error('Error in getImageUrl:', error);
    const statusCode = error.message.split(' ').pop();
    return ERROR_IMAGE_URLS[statusCode] || ERROR_IMAGE_URLS['default'];
  }
}

async function getImageURLfromStore(imageId) {
  if (typeof FLUX_API === 'undefined') {
    return '';
  }
  const rawImageUrlMap = await FLUX_API.get('imageUrlMap');
  if (!rawImageUrlMap) {
    return '';
  }
  const imageUrlMap = JSON.parse(rawImageUrlMap) || [];
  const foundImage = imageUrlMap.find(image => image.imageId === imageId);
  return foundImage ? foundImage.imageUrl : '';
}

async function storeImageURL(imageUrl) {
  if (typeof FLUX_API === 'undefined') {
    return '';
  }
  const rawImageUrlMap = await FLUX_API.get('imageUrlMap');
  let imageUrlMap = rawImageUrlMap ? JSON.parse(rawImageUrlMap) : [];
  const imageId = Math.random().toString(36).substring(2, 15);
  if (imageUrlMap.length >= 1000) {
    imageUrlMap.shift()
  }
  imageUrlMap.push({ imageId, imageUrl });
  await FLUX_API.put('imageUrlMap', JSON.stringify(imageUrlMap));
  return imageId;
}

async function fetchAndReturnImage(imageUrl) {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBlob = await imageResponse.blob();
    return new Response(imageBlob, {
      headers: { 'Content-Type': imageResponse.headers.get('Content-Type') }
    });
  } catch (error) {
    console.error('Error in fetchAndReturnImage:', error);
    return new Response(ERROR_IMAGE_URLS['default'], {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function processPrompt(text, optimize) {
  const processApiKey = PROCESS_API_KEY || '';
  const content = optimize 
    ? `
    # 优化以下图像prompt，保留prompt主要元素基础上使细节、构图更加丰富：
    ## 图像prompt：
    ${text}
    ## 优化要求
    1. 优化后的图像prompt是一组<英文TAG标签>，每个TAG应该遵循构图的基本原则，将画风、构图、主体、动作、场景、元素、按顺序进行描述。
    2. <英文TAG标签>中每个词组用逗号","分割，逗号","前后不允许有"空格"。
    # 仅仅输出优化后的图像prompt，不要有其他说明：
    `
    : `请将以下内容翻译为英文，保持原意：${text}`;

  try {
    const response = await fetch(PROCESS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${processApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "GLM-4-Flash",
        messages: [{ role: "user", content }]
      })
    });

    if (!response.ok) {
      throw new Error(`Translation/Optimization API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('Error in processPrompt:', error);
    return text; // 如果处理失败，返回原始文本
  }
}

function getUsageInstructions() {
  return `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>使用说明</title>
  </head>
  <body>
    <h1>使用说明</h1>
    <p>欢迎使用图像生成 API！请按照以下步骤生成您的图像：</p>

    <h2>1. 请求格式</h2>
    <p>访问 API 的 URL 格式如下：</p>
    <pre>https://your-worker-url/?prompt={您的提示}&size={图像尺寸}&optimization={优化选项}</pre>

    <h3>参数说明</h3>
    <ul>
      <li><strong>prompt</strong>: (必填) 您想要生成图像的描述文本，例如"一位女孩"。</li>
      <li><strong>size</strong>: (可选) 图像的尺寸，格式为 <code>宽度x高度</code>，默认为 <code>512x512</code>。例如：<code>256x256</code> 或 <code>1024x768</code>。</li>
      <li><strong>optimization</strong>: (可选) 是否进行优化，值为 <code>1</code> 表示进行优化，值为 <code>0</code> 或不提供该参数表示不进行优化。</li>
    </ul>

    <h2>2. 返回结果</h2>
    <p>访问 API 后，您将获得生成的图像。若请求成功，您将看到生成的图像。如果请求失败，您会看到错误信息。</p>

    <h2>3. 示例请求</h2>
    <p>您可以通过以下示例请求生成图像：</p>
    <pre>https://your-worker-url/?prompt=一位女孩&size=512x512&optimization=1</pre>
    <p>此请求将生成一幅描述为"一位女孩"的图像，并将其大小设置为 512x512 像素，并进行优化。</p>

    <h2>4. 注意事项</h2>
    <ul>
      <li>确保您的 <code>prompt</code> 参数包含有效的描述。</li>
      <li><code>size</code> 参数应遵循 <code>宽度x高度</code> 格式。</li>
      <li>如果使用优化功能，确保 <code>prompt</code> 中包含非 ASCII 字符。</li>
    </ul>

    <p>如有任何问题，请随时联系 <a href="https://www.aisharenet.com/">https://www.aisharenet.com/</a></p>

  </body>
  </html>
  `;
}

function getGuiPage() {
  return `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图像生成 GUI</title>
  </head>
  <body>
    <h1>图像生成</h1>
    <form id="imageForm">
      <label for="prompt">图像描述:（支持输入中文）</label><br>
      <input type="text" id="prompt" required><br><br>

      <label for="size">图像尺寸 (格式: 宽度x高度，默认: 512x512，宽高不能超过1024):</label><br>
      <input type="text" id="size" value="512x512" required><br><br>

      <label for="optimization">是否优化:</label><br>
      <select id="optimization">
        <option value="0">不优化</option>
        <option value="1">优化</option>
      </select>
      <p>优化选项说明: 选择"优化"将使生成的图像具有更丰富的细节和构图。</p><br>

      <button type="submit">生成图像</button>
    </form>

    <h2>生成结果:</h2>
    <div id="result"></div>
    <div id="status"></div>

    <script>
      document.getElementById('imageForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const prompt = document.getElementById('prompt').value;
        const size = document.getElementById('size').value;
        const optimization = document.getElementById('optimization').value;

        document.getElementById('status').innerText = '正在处理请求...';

        try {
          const response = await fetch(\`/\?prompt=\${encodeURIComponent(prompt)}&size=\${size}&optimization=\${optimization}\`);
          if (response.ok) {
            const blob = await response.blob();
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.style.maxWidth = '100%';
            document.getElementById('result').innerHTML = '';
            document.getElementById('result').appendChild(img);
            document.getElementById('status').innerText = '图像生成成功！';
          } else {
            document.getElementById('result').innerText = '生成图像失败: ' + response.statusText;
            document.getElementById('status').innerText = '请求失败，状态码: ' + response.status;
          }
        } catch (error) {
          document.getElementById('result').innerText = '生成图像过程中出现错误: ' + error.message;
          document.getElementById('status').innerText = '错误信息: ' + error.message;
        }
      });
    </script>
  </body>
  </html>
  `;
}
