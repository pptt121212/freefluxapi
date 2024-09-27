# free flux api
使用免费大模型构建的图像生成API https://www.aisharenet.com/


## 描述
这是一个使用 Cloudflare Workers 构建的图像生成 API。用户可以通过指定图像的描述、尺寸和优化选项，生成所需的图像。

## 功能
- 根据用户提供的提示生成图像。
- 支持图像尺寸的自定义。
- 可选择进行提示优化，以提高生成图像的质量。
- 增加一个简陋的界面，路径后增加`/GUI/`访问

## 使用说明

### 1. 请求格式
访问 API 的 URL 格式如下：

```
https://your-worker-url/?prompt={您的提示}&size={图像尺寸}&optimization={优化选项}
```

### 2. 参数说明
- **prompt**: (必填) 您想要生成图像的描述文本。例如：`一位女孩`。
- **size**: (可选) 图像的尺寸，格式为 `宽度x高度`，默认为 `512x512`。例如：`256x256` 或 `1024x768`。
- **optimization**: (可选) 是否进行优化，值为 `1` 表示进行优化，值为 `0` 或不提供该参数表示不进行优化。

### 3. 返回结果
访问 API 后，您将获得生成的图像。若请求成功，您将看到生成的图像。如果请求失败，您会看到错误信息。

### 4. 示例请求
以下是一个示例请求，生成描述为“一位女孩”的图像：

```
https://your-worker-url/?prompt=一位女孩&size=512x512&optimization=1
```

### 5. 注意事项
- 确保您的 `prompt` 参数包含有效的描述。
- `size` 参数应遵循 `宽度x高度` 格式。
- 如果使用优化功能，确保 `prompt` 中包含非 ASCII 字符。

## 项目依赖的免费API

### 1. 图像生成 API
- **API 地址**: [https://api.siliconflow.cn/v1/image/generations](https://api.siliconflow.cn/v1/image/generations)
- **申请地址**: [https://cloud.siliconflow.cn/](https://cloud.siliconflow.cn/)
- **使用模型**: `black-forest-labs/FLUX.1-schnell`（免费模型）
> 注意速率限制，建议申请多密钥轮询

### 2. 提示处理 API
- **API 地址**: [https://open.bigmodel.cn/api/paas/v4/chat/completions](https://open.bigmodel.cn/api/paas/v4/chat/completions)
- **申请地址**: [https://open.bigmodel.cn/](https://open.bigmodel.cn/)
- **使用模型**: `glm-4-flash`（免费模型）

## 部署指南

### 1. 依赖项
确保您已经在 [Cloudflare](https://www.cloudflare.com/) 注册账户并可以正常添加 Workers。

### 2.配置KV空间
在 Cloudflare Workers 中创建两个 KV 命名空间：API_COUNTER 和 API_KEYS。

在 API_KEYS 命名空间中添加以下键/值对：

imageApiKeys：包含所有图像生成 API 密钥的 JSON 数组，格式：`["key1", "key2", "key3", "key4", "key5"]`

processApiKey：用于提示处理 API 密钥

**API_COUNTER空间不需要添加任何键值。**


在 Worker 设置中绑定这两个 KV 命名空间。

替换workers代码 ERROR_IMAGE_URLS 中的 URL 为你自己的错误图片 URL。


### 3. 设置项目
1. 登录到 Cloudflare 控制面板，创建新的 Worker。
2. 将[workers.js](https://github.com/pptt121212/freefluxapi/blob/main/workers.js)代码复制并粘贴到 Worker 的编辑器中。

### 4. 保存并部署
点击“Save and Deploy”按钮以保存并部署您的 Worker。

## 贡献
欢迎提交问题和功能请求！如果您想为该项目贡献代码，请创建一个分支并提交 Pull Request。

## 许可证
随便
