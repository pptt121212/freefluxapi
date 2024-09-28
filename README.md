# free flux api
使用免费大模型构建的图像生成API https://www.aisharenet.com/


## 描述
这是一个使用 Cloudflare Workers 构建的图像生成 API。用户可以在URL上拼接指定图像的描述、尺寸和优化选项，生成所需的图像。


## 功能
- 根据用户提供的提示生成图像。
- 支持图像尺寸的自定义。
- 可选择进行提示优化，以提高生成图像的质量。
- 增加一个简陋的界面，路径后增加`/gui/`访问

## 使用说明

### 1. 请求格式
访问 API 的 URL 格式如下：

```
https://your-worker-url/?prompt={您的提示}&size={图像尺寸}&optimization={优化选项}
```
==如果开启并绑定KV空间，生成图片时会在URL后拼接一个缓存图片地址的参数==


### 2. 参数说明
- **prompt**: (必填) 您想要生成图像的描述文本。例如：`一位女孩`。
- **size**: (可选) 图像的尺寸，格式为 `宽度x高度`，例如 `512x512`。例如：`256x256` 或 `1024x768`。
- **optimization**: (可选) 是否优化提示词，值为 `1` 表示进行优化，值为 `0` 或不提供该参数表示不进行优化。

### 3. 返回结果
访问 API 后，您将获得生成的图像。若请求成功，您将看到生成的图像。如果请求失败，您会看到错误信息（错误信息返回一张可修改的图片地址）。

### 4. 示例请求
以下是一个示例请求，生成描述为“一位女孩”的图像：

```
https://your-worker-url/?prompt=一位女孩&size=512x512&optimization=1
```

### 5. 注意事项
- 确保您的 `prompt` 参数包含有效的描述。
- `size` 参数应遵循 `宽度x高度` 格式。
- 如果使用优化功能，尽量确保 `prompt` 中包含非 ASCII 字符。

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


### 3. 设置项目
1. 登录到 Cloudflare 控制面板，创建新的 Worker。
2. 将[workers.js](https://github.com/pptt121212/freefluxapi/blob/main/workers.js)代码复制并粘贴到 Worker 的编辑器中。

点击“Save and Deploy”按钮以保存并部署您的 Worker。


### 3.配置KV空间（非必要）
在 Cloudflare Workers 中创建 KV 命名空间：FLUX_API
![image](https://github.com/user-attachments/assets/1a8e6e5e-9954-4fb9-900b-7856f499cf16)


同时绑定变量FLUX_API
![image](https://github.com/user-attachments/assets/b0d029ac-af87-4078-9026-64f3e01e534e)


### 4. 添加变量

![image](https://github.com/user-attachments/assets/e163e0fa-0474-4917-b716-3e3c68742f7d)

**IMAGE_API_KEYS**
可输入多个KEY，支持轮询，格式`key1,key2,key3`

**PROCESS_API_KEY**
输入一个KEY


# 研究中...

抽象出图片请求地址和KEY作为一对数据单独参与图片请求，这样可以方便支持不同的API（前提是请求数据格式相同），例如：

`[
  {"url": "https://api.siliconflow.cn/v1/image/generations", "key": "your-api-key-1"},
  {"url": "https://api.siliconflow.cn/v1/image/generations", "key": "your-api-key-2"},
  {"url": "https://your-worker-url.workers.dev/v1/image/generations", "key": "your-cloudflare-api-key"}
]`


## 贡献
欢迎提交问题和功能请求！如果您想为该项目贡献代码，请创建一个分支并提交 Pull Request。

## 许可证
随便
