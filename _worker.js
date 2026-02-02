/**
 * Cloudflare Worker - Base64 Pro (Floating Cat Ball Edition)
 * 环境变量要求: DB (绑定到 D1 数据库)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      return handleApi(request, env);
    }

    if (path === '/' || path === '/admin') {
      return handleHtml(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

/**
 * 渲染 HTML 页面
 */
async function handleHtml(request, env) {
  const config = await getConfig(env, false); 
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.site_name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js"></script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    
    <style>
        [x-cloak] { display: none !important; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.2); border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }

        .glass-card {
            background: rgba(255, 255, 255, var(--opacity, 0.85));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.04);
        }

        .glass-input {
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }
        .glass-input:focus {
            background: rgba(255, 255, 255, 0.95);
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .spinner {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s ease-in-out infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .bg-checkerboard {
            background-image: 
                linear-gradient(45deg, #eee 25%, transparent 25%), 
                linear-gradient(-45deg, #eee 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #eee 75%), 
                linear-gradient(-45deg, transparent 75%, #eee 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        
        /* 浮动动画 */
        .float-anim { animation: float 6s ease-in-out infinite; }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
        }
    </style>
</head>
<body class="text-slate-800 h-screen flex flex-col relative transition-all duration-700 ease-in-out overflow-hidden"
      style="background-color: #f0f2f5; background-image: url('${config.bg_url || ''}'); background-size: cover; background-position: center;"
      x-data="app()">

    <div class="absolute inset-0 bg-gradient-to-br from-slate-900/40 to-black/50 z-0 pointer-events-none"></div>
    
    <a href="https://github.com/lijboys/img-Glass64" target="_blank" 
       class="fixed z-[100] top-4 right-4 md:top-6 md:right-6 w-11 h-11 md:w-14 md:h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl border border-white/60 transition-all duration-300 hover:scale-110 hover:rotate-12 group cursor-pointer float-anim"
       title="Star on GitHub">
        <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none"></div>
        <svg class="w-6 h-6 md:w-8 md:h-8 text-gray-800 group-hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
        </svg>
    </a>

    <main class="relative z-10 flex-1 overflow-y-auto w-full">
        <div class="min-h-full w-full flex items-center justify-center p-4 py-16 md:py-10">
            
            <div class="glass-card w-full max-w-4xl rounded-3xl p-6 md:p-10 transition-all duration-300 transform"
                 :style="'--opacity: ' + config.card_opacity">
                
                <header class="flex justify-between items-center mb-8 select-none">
                    <div class="flex items-center gap-3 cursor-pointer group" @click="handleTitleClick()">
                        <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900 tracking-tight" x-text="config.site_name"></h1>
                            <p class="text-xs text-gray-500 font-medium">Cloudflare Worker Powered</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 pr-8 md:pr-0"> <span x-show="isAdminMode" class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200 animate-pulse">
                            ADMIN
                        </span>
                        
                        <button x-show="isAdminMode" @click="exitAdmin" class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-gray-200 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                            <span class="hidden sm:inline">首页</span>
                        </button>
                    </div>
                </header>

                <div x-show="!isAdminMode" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-4">
                    <div class="flex p-1 bg-gray-100/50 rounded-xl mb-8 w-fit mx-auto border border-gray-200/50">
                        <button class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                :class="activeTab === 'img2base' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                                @click="activeTab = 'img2base'">
                            <span>🖼️</span> 图片转 Base64
                        </button>
                        <button class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                                :class="activeTab === 'base2img' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                                @click="activeTab = 'base2img'">
                            <span>📝</span> Base64 转图片
                        </button>
                    </div>

                    <div x-show="activeTab === 'img2base'">
                        <div x-show="needsCaptcha" class="mb-6 mx-auto w-fit bg-yellow-50/90 backdrop-blur border border-yellow-200 p-4 rounded-xl shadow-sm text-center">
                            <p class="text-sm text-yellow-800 mb-2 font-medium">🛡️ 安全检查</p>
                            <div id="cf-turnstile-container"></div>
                        </div>

                        <div class="relative group cursor-pointer"
                             @dragover.prevent="dragOver = true"
                             @dragleave.prevent="dragOver = false"
                             @drop.prevent="handleDrop($event)"
                             @click="$refs.fileInput.click()">
                            
                            <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                            
                            <div class="relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 bg-white/40 overflow-hidden"
                                 :class="dragOver ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-gray-300 hover:border-blue-400 hover:bg-white/60'">
                                
                                <input type="file" x-ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect">
                                
                                <div x-show="!previewUrl" class="space-y-3 pointer-events-none">
                                    <div class="w-16 h-16 bg-blue-100/50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-700">点击上传 或 拖拽图片</h3>
                                    <p class="text-sm text-gray-500">支持直接粘贴 (Ctrl+V)</p>
                                </div>

                                <div x-show="previewUrl" class="relative inline-block group/preview">
                                    <img :src="previewUrl" class="max-h-64 rounded-lg shadow-lg object-contain bg-checkerboard">
                                    <button @click.stop="clearImage" class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transform hover:scale-110 transition-all z-10">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex items-center gap-3">
                            <div class="flex-1 relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔗</span>
                                <input type="text" x-model="imageUrlInput" @keyup.enter="convertFromUrl"
                                       placeholder="输入图片直链 URL (https://...)" 
                                       class="glass-input w-full pl-11 pr-4 py-3 rounded-xl outline-none text-sm font-medium text-gray-700 placeholder-gray-400">
                            </div>
                            <button @click="convertFromUrl" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                    :disabled="loading || !imageUrlInput">
                                <span x-show="!loading">转换</span>
                                <div x-show="loading" class="spinner"></div>
                            </button>
                        </div>

                        <div x-show="base64Result" class="mt-8 animate-fade-in-up" x-transition>
                            <div class="flex justify-between items-center mb-2 px-1">
                                <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Base64 结果</label>
                                <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200" x-text="'长度: ' + base64Result.length"></span>
                            </div>
                            <div class="relative group">
                                <textarea x-model="base64Result" readonly rows="5" 
                                          class="glass-input w-full p-4 rounded-xl text-xs font-mono text-gray-600 resize-none outline-none"></textarea>
                                <button @click="copyToClipboard" 
                                        class="absolute top-3 right-3 bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100">
                                    <span x-text="copyBtnText"></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div x-show="activeTab === 'base2img'" x-cloak>
                        <textarea x-model="base64Input" placeholder="在此粘贴 Base64 字符串..." rows="6" 
                                  class="glass-input w-full p-4 rounded-xl font-mono text-xs text-gray-700 outline-none resize-none"></textarea>
                        
                        <div x-show="base64Input" class="mt-6 bg-white/50 border border-gray-200 rounded-xl p-6 text-center" x-transition>
                            <p class="text-xs text-gray-500 mb-4 uppercase tracking-wide font-bold">解码预览</p>
                            <div class="inline-block relative shadow-lg rounded-lg overflow-hidden bg-checkerboard">
                                <img :src="formattedBase64" class="max-w-full max-h-[400px] block object-contain">
                            </div>
                        </div>
                    </div>
                </div>

                <div x-show="isAdminMode" x-cloak class="space-y-8 animate-fade-in">
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
                            <div class="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">总转换次数</div>
                            <div class="text-3xl font-black text-gray-800" x-text="stats.convertCount || 0">0</div>
                        </div>
                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100 shadow-sm">
                            <div class="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">今日验证 IP</div>
                            <div class="text-3xl font-black text-gray-800" x-text="stats.verifyCount || 0">0</div>
                        </div>
                    </div>

                    <form @submit.prevent="saveConfig" class="space-y-6">
                        <div class="bg-white/40 rounded-2xl p-6 border border-white/50 relative overflow-hidden">
                            <h3 class="font-bold text-gray-800 mb-4 border-b border-gray-200/50 pb-2">🎨 界面外观</h3>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div class="col-span-1">
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 ml-1">网站标题</label>
                                    <input type="text" x-model="adminConfig.site_name" class="glass-input w-full rounded-lg p-2.5 text-sm">
                                </div>
                                <div class="col-span-1">
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 ml-1">卡片透明度 (0.1 - 1.0)</label>
                                    <input type="number" step="0.1" min="0.1" max="1.0" x-model="adminConfig.card_opacity" class="glass-input w-full rounded-lg p-2.5 text-sm">
                                </div>
                                
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 ml-1">背景图片 URL</label>
                                    
                                    <input type="text" x-model="adminConfig.bg_url" placeholder="https://..." class="glass-input w-full rounded-lg p-2.5 text-sm font-mono text-gray-600 mb-2">
                                    
                                    <div x-show="adminConfig.bg_url" class="mt-2 text-center">
                                        <div class="inline-block relative">
                                            <p class="text-[10px] text-gray-400 mb-1 text-left">预览效果 (点击放大):</p>
                                            <div class="w-[150px] h-[150px] mx-auto rounded-xl overflow-hidden border-2 border-white shadow-md cursor-zoom-in bg-gray-100 transition-all hover:shadow-lg group" @click="showBgPreview = true" title="点击查看大图">
                                                <img :src="adminConfig.bg_url" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white/40 rounded-2xl p-6 border border-white/50">
                            <h3 class="font-bold text-gray-800 mb-4 border-b border-gray-200/50 pb-2">🔑 账户设置</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 ml-1">修改管理员密码</label>
                                    <input type="text" x-model="adminConfig.admin_password" class="glass-input w-full rounded-lg p-2.5 text-sm font-mono text-blue-600 font-bold" placeholder="留空则不修改">
                                </div>
                            </div>
                        </div>

                        <div class="bg-white/40 rounded-2xl p-6 border border-white/50">
                            <h3 class="font-bold text-gray-800 mb-4 border-b border-gray-200/50 pb-2">🛡️ 人机验证 (Turnstile)</h3>
                            <div class="mb-4">
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="checkbox" x-model="adminConfig.turnstile_enabled_bool" class="sr-only peer">
                                    <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                    <span class="ms-3 text-sm font-medium text-gray-700">启用 Cloudflare Turnstile</span>
                                </label>
                            </div>
                            <div x-show="adminConfig.turnstile_enabled_bool" class="grid grid-cols-1 gap-4" x-transition>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Site Key</label>
                                    <input type="text" x-model="adminConfig.turnstile_site_key" class="glass-input w-full rounded-lg p-2.5 text-xs font-mono">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 ml-1">Secret Key</label>
                                    <input type="text" x-model="adminConfig.turnstile_secret_key" class="glass-input w-full rounded-lg p-2.5 text-xs font-mono">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 mb-1.5 ml-1">频率策略</label>
                                    <select x-model="adminConfig.turnstile_mode" class="glass-input w-full rounded-lg p-2.5 text-sm">
                                        <option value="always">每次操作都验证</option>
                                        <option value="daily">每个 IP 每天仅一次</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end pt-4">
                            <button type="submit" class="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl text-sm font-bold shadow-xl shadow-gray-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2" :disabled="saving">
                                <svg x-show="!saving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                <div x-show="saving" class="spinner w-4 h-4"></div>
                                <span x-text="saving ? '保存中...' : '保存配置'"></span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </main>

    <footer class="absolute bottom-2 w-full text-center text-[10px] text-white/40 z-10 select-none">
        Powered by Cloudflare Workers
    </footer>

    <button x-show="hasLocalAdmin && !isAdminMode" 
            @click="enterAdminDirectly"
            class="fixed bottom-6 right-6 z-50 bg-white/90 hover:bg-white text-gray-800 px-4 py-3 rounded-full shadow-2xl backdrop-blur border border-gray-200 transition-all hover:scale-105 group flex items-center gap-2 font-bold text-sm"
            title="快速进入后台">
        <svg class="w-5 h-5 group-hover:rotate-90 transition-transform text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        Admin
    </button>

    <div x-show="showLogin" x-cloak class="fixed inset-0 z-[60] flex items-center justify-center">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showLogin = false"></div>
        <div class="bg-white rounded-2xl p-8 w-80 shadow-2xl relative z-10 animate-scale-in">
            <div class="text-center mb-6">
                <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800">管理员验证</h3>
                <p class="text-xs text-gray-400 mt-1">请输入密码进入后台</p>
            </div>
            <input type="password" x-model="loginPassword" @keyup.enter="login" placeholder="Password" class="w-full bg-gray-50 border border-gray-200 text-center rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
            <button @click="login" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95">验证进入</button>
        </div>
    </div>

    <div x-show="showBgPreview" x-cloak class="fixed inset-0 z-[70] flex items-center justify-center p-4" @click="showBgPreview = false">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        <div class="relative z-10 max-w-5xl max-h-screen">
            <img :src="adminConfig.bg_url" class="max-w-full max-h-[90vh] rounded shadow-2xl border-4 border-white/20 transition-transform cursor-zoom-out">
            <p class="text-center text-white/80 mt-2 text-sm">点击任意处关闭</p>
        </div>
    </div>

    <script>
        function app() {
            return {
                activeTab: 'img2base',
                dragOver: false,
                previewUrl: null,
                base64Result: '',
                base64Input: '',
                imageUrlInput: '',
                loading: false,
                copyBtnText: '复制',
                
                titleClickCount: 0,
                clickTimer: null,
                showLogin: false,
                isAdminMode: false,
                hasLocalAdmin: false,
                loginPassword: '',
                savedPassword: '',
                saving: false,
                showBgPreview: false,
                stats: {},
                
                config: ${JSON.stringify(config)},
                adminConfig: {},
                needsCaptcha: false,
                turnstileToken: null,

                get formattedBase64() {
                    if (!this.base64Input) return '';
                    let val = this.base64Input.trim();
                    if (!val.startsWith('data:image')) return 'data:image/png;base64,' + val;
                    return val;
                },

                init() {
                    window.addEventListener('paste', e => this.handlePaste(e));
                    // 核心：读取本地存储的密码
                    const localPass = localStorage.getItem('admin_pass_cache');
                    if (localPass) {
                        this.hasLocalAdmin = true;
                        this.savedPassword = localPass;
                    }
                    if (window.location.pathname === '/admin') {
                        if (this.hasLocalAdmin) {
                           this.verifyAndEnter(this.savedPassword);
                        } else {
                           this.showLogin = true;
                        }
                    }
                    this.checkAuthRequirement();
                },

                handlePaste(e) {
                    if (this.activeTab !== 'img2base') return;
                    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
                    for (let item of items) {
                        if (item.kind === 'file' && item.type.startsWith('image/')) {
                            this.processFile(item.getAsFile());
                            return;
                        }
                    }
                },
                handleFileSelect(e) { if(e.target.files.length) this.processFile(e.target.files[0]); },
                handleDrop(e) { this.dragOver = false; if(e.dataTransfer.files.length) this.processFile(e.dataTransfer.files[0]); },
                
                processFile(file) {
                    if(this.needsCaptcha) { alert('请先完成验证'); return; }
                    this.loading = true;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.previewUrl = e.target.result;
                        this.base64Result = e.target.result;
                        this.recordUsage();
                        this.loading = false;
                    };
                    reader.readAsDataURL(file);
                },

                clearImage() {
                    this.previewUrl = null;
                    this.base64Result = '';
                    this.$refs.fileInput.value = '';
                    this.imageUrlInput = '';
                },

                async convertFromUrl() {
                    if(this.needsCaptcha) { alert('请先完成验证'); return; }
                    if (!this.imageUrlInput) return;
                    this.loading = true;
                    try {
                        const res = await fetch('/api/convert-url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: this.imageUrlInput })
                        });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        this.base64Result = data.base64;
                        this.previewUrl = data.base64;
                        this.recordUsage();
                    } catch (e) { alert('转换失败: ' + e.message); } finally { this.loading = false; }
                },

                copyToClipboard() {
                    navigator.clipboard.writeText(this.base64Result).then(() => {
                        this.copyBtnText = '已复制';
                        setTimeout(() => this.copyBtnText = '复制', 2000);
                    });
                },
                
                async recordUsage() { fetch('/api/stats/record', { method: 'POST' }); },

                async checkAuthRequirement() {
                    try {
                        const res = await fetch('/api/check-auth');
                        const data = await res.json();
                        this.needsCaptcha = data.required;
                        if (this.needsCaptcha && data.siteKey) {
                            this.$nextTick(() => {
                                if(window.turnstile) {
                                    turnstile.render('#cf-turnstile-container', {
                                        sitekey: data.siteKey,
                                        callback: (token) => {
                                            this.turnstileToken = token;
                                            this.verifyCaptcha(token);
                                        },
                                    });
                                }
                            });
                        }
                    } catch (e) {}
                },
                async verifyCaptcha(token) {
                    const res = await fetch('/api/verify-captcha', {
                        method: 'POST',
                        body: JSON.stringify({ token })
                    });
                    if ((await res.json()).success) {
                        this.needsCaptcha = false;
                        this.turnstileToken = null;
                    }
                },

                handleTitleClick() {
                    if (this.isAdminMode) return;
                    this.titleClickCount++;
                    clearTimeout(this.clickTimer);
                    this.clickTimer = setTimeout(() => this.titleClickCount = 0, 2000);
                    if (this.titleClickCount >= 5) {
                        this.showLogin = true;
                        this.titleClickCount = 0;
                    }
                },

                async login() {
                    await this.verifyAndEnter(this.loginPassword);
                },

                async verifyAndEnter(password) {
                    const res = await fetch('/api/login', {
                        method: 'POST',
                        body: JSON.stringify({ password: password })
                    });
                    if (res.ok) {
                        this.isAdminMode = true;
                        this.showLogin = false;
                        this.hasLocalAdmin = true;
                        this.savedPassword = password;
                        // 永久存储密码，实现“记住我”
                        localStorage.setItem('admin_pass_cache', password);
                        this.loadAdminData();
                    } else {
                        if(!this.showLogin && this.hasLocalAdmin) {
                            this.hasLocalAdmin = false;
                            localStorage.removeItem('admin_pass_cache');
                            alert('鉴权已过期，请重新登录');
                            this.showLogin = true;
                        } else {
                            alert('密码错误');
                        }
                    }
                },

                enterAdminDirectly() {
                    this.verifyAndEnter(this.savedPassword);
                    // 切换 URL 但不刷新
                    window.history.pushState({}, '', '/admin');
                },

                exitAdmin() {
                    this.isAdminMode = false;
                    // 切换 URL 回首页
                    window.history.pushState({}, '', '/');
                },

                async loadAdminData() {
                    const headers = { 'X-Admin-Auth': this.savedPassword };
                    const [conf, stat] = await Promise.all([
                        (await fetch('/api/admin/config', { headers })).json(),
                        (await fetch('/api/admin/stats', { headers })).json()
                    ]);
                    conf.turnstile_enabled_bool = conf.turnstile_enabled === 'true';
                    this.adminConfig = conf;
                    this.stats = stat;
                },

                async saveConfig() {
                    this.saving = true;
                    this.adminConfig.turnstile_enabled = this.adminConfig.turnstile_enabled_bool.toString();
                    const headers = { 'X-Admin-Auth': this.savedPassword, 'Content-Type': 'application/json' };
                    
                    await fetch('/api/admin/config', {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(this.adminConfig)
                    });
                    
                    if (this.adminConfig.admin_password && this.adminConfig.admin_password.trim() !== '') {
                        this.savedPassword = this.adminConfig.admin_password.trim();
                        localStorage.setItem('admin_pass_cache', this.savedPassword);
                        this.adminConfig.admin_password = '';
                        alert('配置已保存，密码已修改！');
                    } else {
                        alert('配置已保存');
                    }

                    this.saving = false;
                    this.config.site_name = this.adminConfig.site_name;
                    this.config.card_opacity = this.adminConfig.card_opacity;
                    this.config.bg_url = this.adminConfig.bg_url;
                    document.body.style.backgroundImage = 'url(' + this.adminConfig.bg_url + ')';
                }
            }
        }
    </script>
</body>
</html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

// API 逻辑
async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  if (path === '/api/check-auth') return checkAuthStatus(request, env);
  if (path === '/api/verify-captcha') return verifyCaptchaToken(request, env);
  if (path === '/api/convert-url' && request.method === 'POST') {
    try {
        const { url } = await request.json();
        const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Worker' }});
        if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
        const buffer = await imgRes.arrayBuffer();
        if (buffer.byteLength > 15 * 1024 * 1024) throw new Error('Image too large (>15MB)');
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const type = imgRes.headers.get('content-type') || 'image/png';
        return Response.json({ base64: `data:${type};base64,${base64}` });
    } catch(e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
  }
  if (path === '/api/stats/record') {
     try { await env.DB.prepare("INSERT INTO stats (action_type, created_at) VALUES ('convert', ?)").bind(Date.now()).run(); } catch(e){}
     return Response.json({ ok: true });
  }

  if (path === '/api/login' && request.method === 'POST') {
    const { password } = await request.json();
    const dbPass = await env.DB.prepare("SELECT value FROM config WHERE key = 'admin_password'").first('value');
    return password === dbPass ? Response.json({ ok: true }) : Response.json({ error: 'Auth failed' }, { status: 401 });
  }

  // 鉴权
  const authHeader = request.headers.get('X-Admin-Auth');
  const dbPass = await env.DB.prepare("SELECT value FROM config WHERE key = 'admin_password'").first('value');
  if (authHeader !== dbPass) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (path === '/api/admin/config') {
     if (request.method === 'POST') {
          const cfg = await request.json();
          const stmt = env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)");
          const batch = [];
          
          for (const [k, v] of Object.entries(cfg)) {
              if (k === 'turnstile_enabled_bool') continue;
              if (k === 'admin_password') {
                  if (!v || v.trim() === '') continue; 
                  batch.push(stmt.bind(k, v.trim()));
                  continue;
              }
              batch.push(stmt.bind(k, v));
          }
          
          if (batch.length > 0) await env.DB.batch(batch);
          return Response.json({ ok: true });
     }
     const { results } = await env.DB.prepare("SELECT * FROM config").all();
     const config = results.reduce((acc, curr) => ({...acc, [curr.key]: curr.value}), {});
     config.admin_password = '';
     return Response.json(config);
  }

  if (path === '/api/admin/stats') {
      const convertCount = await env.DB.prepare("SELECT count(*) as c FROM stats WHERE action_type = 'convert'").first('c');
      const startOfDay = new Date().setHours(0,0,0,0);
      const verifyCount = await env.DB.prepare("SELECT count(DISTINCT ip) as c FROM stats WHERE action_type = 'verify' AND created_at > ?").bind(startOfDay).first('c');
      return Response.json({ convertCount, verifyCount });
  }

  return new Response('API Not Found', { status: 404 });
}

async function getConfig(env, includeSecrets) {
    let config = { site_name: 'Base64 Tool', bg_url: '', card_opacity: '0.85' };
    try {
        const { results } = await env.DB.prepare("SELECT * FROM config").all();
        if(results) config = results.reduce((acc, curr) => ({...acc, [curr.key]: curr.value}), config);
    } catch(e) {}
    if (!includeSecrets) {
        delete config.turnstile_secret_key;
        delete config.admin_password;
    }
    return config;
}

async function checkAuthStatus(request, env) {
    const config = await getConfig(env, true);
    if (config.turnstile_enabled !== 'true') return Response.json({ required: false });
    const ip = request.headers.get('CF-Connecting-IP');
    if (config.turnstile_mode === 'daily') {
        const startOfDay = new Date().setHours(0,0,0,0);
        const has = await env.DB.prepare("SELECT id FROM stats WHERE action_type='verify' AND ip=? AND created_at > ?").bind(ip, startOfDay).first();
        if (has) return Response.json({ required: false });
    }
    return Response.json({ required: true, siteKey: config.turnstile_site_key });
}

async function verifyCaptchaToken(request, env) {
    const { token } = await request.json();
    const ip = request.headers.get('CF-Connecting-IP');
    const config = await getConfig(env, true);
    const formData = new FormData();
    formData.append('secret', config.turnstile_secret_key);
    formData.append('response', token);
    formData.append('remoteip', ip);
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { body: formData, method: 'POST' });
    const outcome = await result.json();
    if (outcome.success) {
        await env.DB.prepare("INSERT INTO stats (ip, action_type, created_at) VALUES (?, 'verify', ?)").bind(ip, Date.now()).run();
    }
    return Response.json({ success: outcome.success });
}
