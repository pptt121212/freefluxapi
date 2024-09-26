// Constants
const IMAGE_API_URL = 'https://api.siliconflow.cn/v1/image/generations'
const IMAGE_API_KEY = ''
const PROCESS_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const PROCESS_API_KEY = ''
const DEFAULT_SIZE = '512x512'
const SIZE_REGEX = /^\d+x\d+$/
const NON_ASCII_REGEX = /[^\x00-\x7F]/

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const url = new URL(request.url)

    // Check if the request is for the main page
    if (url.pathname === '/') {
      return new Response(getUsageInstructions(), {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const { prompt, size, optimization } = parseRequestParams(request)
    const processedPrompt = await getProcessedPrompt(prompt, optimization)
    const imageUrl = await getImageUrl(processedPrompt, size)
    return await fetchAndReturnImage(imageUrl)
  } catch (error) {
    return new Response(error.message, { status: error.status || 500 })
  }
}

function parseRequestParams(request) {
  const url = new URL(request.url)
  const prompt = url.searchParams.get('prompt')
  const size = url.searchParams.get('size') || DEFAULT_SIZE
  const optimization = url.searchParams.get('optimization') === '1'

  if (!prompt) {
    throw new Error('Missing prompt parameter')
  }
  if (!SIZE_REGEX.test(size)) {
    throw new Error('Invalid size parameter. Use format: widthxheight')
  }

  return { prompt, size, optimization }
}

async function getProcessedPrompt(prompt, optimization) {
  if (!NON_ASCII_REGEX.test(prompt) && !optimization) {
    return prompt
  }
  return processPrompt(prompt, optimization)
}

async function getImageUrl(prompt, size) {
  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${IMAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt,
      image_size: size
    })
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const imageUrl = data?.images?.[0]?.url

  if (!imageUrl) {
    throw new Error('Unexpected API response format')
  }

  return imageUrl
}

async function fetchAndReturnImage(imageUrl) {
  const imageResponse = await fetch(imageUrl)
  const imageBlob = await imageResponse.blob()
  return new Response(imageBlob, {
    headers: { 'Content-Type': imageResponse.headers.get('Content-Type') }
  })
}

async function processPrompt(text, optimize) {
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
    : `请将以下内容翻译为英文，保持原意：${text}`

  const response = await fetch(PROCESS_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PROCESS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "GLM-4-Flash",
      messages: [{ role: "user", content }]
    })
  })

  if (!response.ok) {
    throw new Error(`Translation/Optimization API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content?.trim() || text
}

// 函数：返回使用说明的HTML内容
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
      <li><strong>prompt</strong>: (必填) 您想要生成图像的描述文本，例如“一位女孩”。</li>
      <li><strong>size</strong>: (可选) 图像的尺寸，格式为 <code>宽度x高度</code>，默认为 <code>512x512</code>。例如：<code>256x256</code> 或 <code>1024x768</code>。</li>
      <li><strong>optimization</strong>: (可选) 是否进行优化，值为 <code>1</code> 表示进行优化，值为 <code>0</code> 或不提供该参数表示不进行优化。</li>
    </ul>

    <h2>2. 返回结果</h2>
    <p>访问 API 后，您将获得生成的图像。若请求成功，您将看到生成的图像。如果请求失败，您会看到错误信息。</p>

    <h2>3. 示例请求</h2>
    <p>您可以通过以下示例请求生成图像：</p>
    <pre>https://your-worker-url/?prompt=一位女孩&size=512x512&optimization=1</pre>
    <p>此请求将生成一幅描述为“一位女孩”的图像，并将其大小设置为 512x512 像素，并进行优化。</p>

    <h2>4. 注意事项</h2>
    <ul>
      <li>确保您的 <code>prompt</code> 参数包含有效的描述。</li>
      <li><code>size</code> 参数应遵循 <code>宽度x高度</code> 格式。</li>
      <li>如果使用优化功能，确保 <code>prompt</code> 中包含非 ASCII 字符。</li>
    </ul>

    <p>如有任何问题，请随时联系支持团队！</p>
  </body>
  </html>
  `
}
