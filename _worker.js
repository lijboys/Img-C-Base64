/**
 * Cloudflare Worker - Glass64 Pro (Download & View Features)
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
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        
        .bg-grid-pattern {
            background-color: #ffffff;
            background-image: linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
            background-size: 40px 40px;
            mask-image: linear-gradient(to bottom, transparent, 5%, white, 95%, transparent);
            -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 80%, transparent 100%);
        }

        .text-gradient {
            background: linear-gradient(to right, #2563eb, #9333ea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.1); border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }

        .glass-panel {
            background: rgba(255, 255, 255, var(--opacity, 0.9));
            backdrop-filter: blur(12px);
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }

        .loader {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .float-anim { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0px); } }
    </style>
</head>
<body class="text-slate-800 h-screen flex flex-col overflow-hidden bg-white relative" x-data="app()">

    <div class="absolute inset-0 bg-grid-pattern z-0 pointer-events-none"></div>
    
    <header class="relative z-50 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-4">
            <div class="flex items-center gap-2 cursor-pointer" @click="goHome()">
                <div class="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">G</div>
                <span class="text-xl font-bold tracking-tight text-slate-900 hidden sm:block" x-text="config.site_name"></span>
            </div>
            <button @click="goHome()" class="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" :title="t('back_home')">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 01-1 1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </button>
        </div>

        <div class="flex items-center gap-3">
            <a href="https://github.com/lijboys/Img-C-Base64" target="_blank" 
               class="hidden md:flex items-center gap-3 bg-[#111] hover:bg-black text-white px-4 py-1.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path></svg>
                <div class="flex flex-col items-start leading-none">
                    <span class="text-[10px] text-gray-400 font-medium" x-text="t('star_on_github')"></span>
                    <span class="text-xs font-bold mt-0.5">GitHub</span>
                </div>
            </a>

            <button @click="toggleLang" class="flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
                <span class="px-3 py-1 rounded-full text-xs font-bold transition-all" 
                      :class="lang === 'en' ? 'bg-white shadow text-black' : 'text-gray-400'">EN</span>
                <span class="px-3 py-1 rounded-full text-xs font-bold transition-all" 
                      :class="lang === 'zh' ? 'bg-white shadow text-black' : 'text-gray-400'">中</span>
            </button>

            <button x-show="isAdminMode" @click="logout" class="text-sm font-medium text-red-500 hover:text-red-700 transition-colors px-2">
                <span x-text="t('exit_logout')"></span>
            </button>
        </div>
    </header>

    <main class="relative z-10 flex-1 overflow-y-auto w-full">
        <div class="min-h-full w-full flex flex-col items-center justify-start pt-10 pb-20 px-4">
            
            <div x-show="!isAdminMode" class="text-center mb-10 space-y-2 animate-fade-in-up">
                <h1 class="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                    <span x-text="t('welcome_1')"></span> <span class="text-gradient">Base64</span> <span x-text="t('welcome_2')"></span>
                </h1>
                <p class="text-lg text-slate-500 max-w-2xl mx-auto" x-text="t('subtitle')"></p>
            </div>

            <div class="glass-panel w-full max-w-4xl rounded-3xl p-1 shadow-xl ring-1 ring-gray-900/5" :style="'--opacity: ' + config.card_opacity">
                <div class="bg-white/50 rounded-[20px] p-6 md:p-8">
                    
                    <div x-show="isAdminMode" class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                        <h2 class="text-xl font-bold">⚙️ <span x-text="t('admin_panel')"></span></h2>
                        <span class="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-mono">ADMIN MODE</span>
                    </div>

                    <div x-show="!isAdminMode">
                        <div class="flex justify-center mb-8">
                            <div class="flex bg-gray-100/80 p-1.5 rounded-xl">
                                <button @click="activeTab = 'img2base'" 
                                        class="px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200"
                                        :class="activeTab === 'img2base' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'">
                                    <span x-text="t('tab_img2base')"></span>
                                </button>
                                <button @click="activeTab = 'base2img'" 
                                        class="px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200"
                                        :class="activeTab === 'base2img' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'">
                                    <span x-text="t('tab_base2img')"></span>
                                </button>
                            </div>
                        </div>

                        <div x-show="activeTab === 'img2base'">
                            <div x-show="needsCaptcha" class="mb-6 flex justify-center">
                                <div class="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-center">
                                    <p class="text-sm text-yellow-800 mb-2 font-medium" x-text="t('captcha_required')"></p>
                                    <div id="cf-turnstile-container"></div>
                                </div>
                            </div>

                            <div class="relative group cursor-pointer"
                                 @dragover.prevent="dragOver = true"
                                 @dragleave.prevent="dragOver = false"
                                 @drop.prevent="handleDrop($event)"
                                 @click="$refs.fileInput.click()">
                                
                                <div class="border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 bg-gray-50/50 hover:bg-blue-50/50"
                                     :class="dragOver ? 'border-blue-500 scale-[1.01]' : 'border-gray-300 hover:border-blue-400'">
                                    
                                    <input type="file" x-ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect">
                                    
                                    <div x-show="!previewUrl" class="space-y-4 pointer-events-none">
                                        <div class="w-16 h-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto text-blue-600 border border-gray-100">
                                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-bold text-gray-900" x-text="t('upload_title')"></h3>
                                            <p class="text-sm text-gray-500 mt-1"><span x-text="t('upload_subtitle')"></span> (Max 20MB)</p>
                                        </div>
                                    </div>

                                    <div x-show="previewUrl" class="relative inline-block group/preview">
                                        <img :src="previewUrl" class="max-h-64 rounded-lg shadow-md object-contain bg-checkerboard">
                                        <button @click.stop="clearImage" class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow hover:bg-red-600 transition-all">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-6 flex items-center gap-3">
                                <div class="flex-1 relative group">
                                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                    </div>
                                    <input type="text" x-model="imageUrlInput" @keyup.enter="convertFromUrl"
                                           :placeholder="t('url_placeholder')"
                                           class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium">
                                </div>
                                <button @click="convertFromUrl" 
                                        class="bg-black hover:bg-gray-800 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                        :disabled="loading || !imageUrlInput">
                                    <span x-show="!loading" x-text="t('convert_btn')"></span>
                                    <div x-show="loading" class="loader"></div>
                                </button>
                            </div>

                            <div x-show="base64Result" class="mt-8 animate-fade-in-up">
                                <div class="flex justify-between items-center mb-2 px-1">
                                    <label class="text-xs font-bold text-gray-500 uppercase tracking-wider" x-text="t('base64_output')"></label>
                                    <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200" x-text="t('length') + ': ' + base64Result.length"></span>
                                </div>
                                <div class="relative group">
                                    <textarea x-model="base64Result" readonly rows="5" 
                                              class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 resize-none outline-none focus:border-blue-500 transition-colors"></textarea>
                                    <button @click="copyToClipboard" 
                                            class="absolute top-3 right-3 bg-white text-gray-700 border border-gray-200 hover:border-blue-500 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <span x-text="copyBtnText"></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div x-show="activeTab === 'base2img'" x-cloak>
                            <textarea x-model="base64Input" :placeholder="t('base64_placeholder')" rows="6" 
                                      class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 resize-none outline-none focus:border-blue-500 transition-colors"></textarea>
                            
                            <div x-show="base64Input" class="mt-6 border border-gray-200 rounded-xl p-6 text-center bg-white" x-transition>
                                <p class="text-xs text-gray-400 mb-4 uppercase font-bold tracking-wider" x-text="t('preview')"></p>
                                <div class="inline-block relative shadow-lg rounded-lg overflow-hidden bg-checkerboard mb-6">
                                    <img :src="formattedBase64" class="max-w-full max-h-[400px] block object-contain">
                                </div>
                                
                                <div class="flex justify-center gap-4">
                                    <a :href="formattedBase64" download="image.png" class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-bold text-sm shadow-md active:scale-95">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        <span x-text="t('download')"></span>
                                    </a>
                                    <button @click="showImage(formattedBase64)" class="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-all font-bold text-sm shadow-sm active:scale-95">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                                        <span x-text="t('view_image')"></span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div x-show="isAdminMode" x-cloak class="space-y-8">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                <div class="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1" x-text="t('stat_total')"></div>
                                <div class="text-3xl font-black text-slate-800" x-text="stats.convertCount || 0">0</div>
                            </div>
                            <div class="bg-green-50 p-5 rounded-2xl border border-green-100">
                                <div class="text-green-500 text-xs font-bold uppercase tracking-wider mb-1" x-text="t('stat_ip')"></div>
                                <div class="text-3xl font-black text-slate-800" x-text="stats.verifyCount || 0">0</div>
                            </div>
                        </div>

                        <form @submit.prevent="saveConfig" class="space-y-6">
                            <div>
                                <h3 class="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2" x-text="t('settings_ui')"></h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1" x-text="t('label_site_name')"></label>
                                        <input type="text" x-model="adminConfig.site_name" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1" x-text="t('label_opacity')"></label>
                                        <input type="number" step="0.1" min="0.1" max="1.0" x-model="adminConfig.card_opacity" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 transition-colors">
                                    </div>
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1" x-text="t('label_bg_url')"></label>
                                        <input type="text" x-model="adminConfig.bg_url" placeholder="https://..." class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-mono text-gray-600 mb-2 outline-none focus:border-blue-500 transition-colors">
                                        <div x-show="adminConfig.bg_url" class="mt-2 text-center">
                                            <div class="inline-block relative group cursor-pointer" @click="showImage(adminConfig.bg_url)">
                                                <div class="w-[150px] h-[150px] mx-auto rounded-xl overflow-hidden border-2 border-white shadow-lg bg-gray-100">
                                                    <img :src="adminConfig.bg_url" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                                                </div>
                                                <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 class="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2" x-text="t('settings_account')"></h3>
                                <div>
                                    <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1" x-text="t('label_new_pass')"></label>
                                    <input type="text" x-model="adminConfig.admin_password" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-mono text-blue-600" :placeholder="t('placeholder_pass')">
                                </div>
                            </div>

                            <div>
                                <h3 class="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2" x-text="t('settings_turnstile')"></h3>
                                <div class="mb-4">
                                    <label class="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" x-model="adminConfig.turnstile_enabled_bool" class="sr-only peer">
                                        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-black after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                        <span class="ms-3 text-sm font-bold text-gray-600" x-text="t('enable_turnstile')"></span>
                                    </label>
                                </div>
                                <div x-show="adminConfig.turnstile_enabled_bool" class="grid grid-cols-1 gap-4">
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-1 ml-1" x-text="t('site_key')"></label>
                                        <input type="text" x-model="adminConfig.turnstile_site_key" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-mono">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-1 ml-1" x-text="t('secret_key')"></label>
                                        <input type="text" x-model="adminConfig.turnstile_secret_key" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs font-mono">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-1 ml-1" x-text="t('verify_mode')"></label>
                                        <select x-model="adminConfig.turnstile_mode" class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm">
                                            <option value="always" x-text="t('mode_always')"></option>
                                            <option value="daily" x-text="t('mode_daily')"></option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="flex justify-end pt-4">
                                <button type="submit" class="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2" :disabled="saving">
                                    <span x-text="saving ? t('saving') : t('save_config')"></span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <button x-show="hasLocalAdmin && !isAdminMode" @click="enterAdminDirectly"
            class="fixed bottom-6 right-6 z-50 bg-black text-white px-4 py-3 rounded-full shadow-2xl transition-all hover:scale-105 flex items-center gap-2 font-bold text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        Admin
    </button>

    <div x-show="showLogin" x-cloak class="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm" @click="showLogin = false">
        <div class="bg-white rounded-2xl p-8 w-80 shadow-2xl animate-fade-in-up" @click.stop>
            <h3 class="text-xl font-black text-center mb-6" x-text="t('admin_login')"></h3>
            <input type="password" x-model="loginPassword" @keyup.enter="login" :placeholder="t('password')" class="w-full bg-gray-50 border border-gray-200 text-center rounded-xl p-3 mb-4 outline-none focus:border-black transition-colors">
            <button @click="login" class="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all" x-text="t('verify')"></button>
        </div>
    </div>

    <div x-show="showModal" x-cloak class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click="showModal = false">
        <img :src="modalImageUrl" class="max-w-full max-h-[90vh] rounded shadow-2xl transition-transform" @click.stop>
        <button class="absolute top-6 right-6 text-white hover:text-gray-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
    </div>

    <script>
        const i18n = {
            zh: {
                star_on_github: '在 GitHub 上加星',
                back_home: '返回首页',
                exit_logout: '退出登录',
                welcome_1: '欢迎来到',
                welcome_2: '',
                subtitle: '立即转换您的图片。本地处理，隐私安全，即时可用。',
                tab_img2base: '图片转 Base64',
                tab_base2img: 'Base64 转图片',
                captcha_required: '🛡️ 安全检查：请先完成验证',
                upload_title: '点击上传 或 拖拽图片',
                upload_subtitle: '支持粘贴 (Ctrl+V)',
                url_placeholder: '输入图片直链 URL (https://...)',
                convert_btn: '开始转换',
                base64_placeholder: '在此粘贴 Base64 字符串...',
                base64_output: 'Base64 结果',
                length: '长度',
                preview: '预览结果',
                download: '下载图片',
                view_image: '查看大图',
                stat_total: '总转换次数',
                stat_ip: '今日验证 IP',
                admin_panel: '系统配置',
                admin_login: '管理员登录',
                password: '密码',
                verify: '验证',
                settings_ui: '界面外观',
                label_site_name: '网站标题',
                label_opacity: '卡片透明度',
                label_bg_url: '背景图片链接',
                settings_account: '账户设置',
                label_new_pass: '修改管理员密码',
                placeholder_pass: '留空则不修改',
                settings_turnstile: 'CF小组件验证',
                enable_turnstile: '开启 CF 小组件验证',
                site_key: 'Site Key',
                secret_key: 'Secret Key',
                verify_mode: '验证频率',
                mode_always: '每次都验证',
                mode_daily: '每天验证一次 (IP)',
                save_config: '保存配置',
                saving: '保存中...'
            },
            en: {
                star_on_github: 'Star on GitHub',
                back_home: 'Home',
                exit_logout: 'Logout',
                welcome_1: 'Welcome to',
                welcome_2: '',
                subtitle: 'Convert your images instantly. Local processing, secure, and fast.',
                tab_img2base: 'Image to Base64',
                tab_base2img: 'Base64 to Image',
                captcha_required: '🛡️ Security Check Required',
                upload_title: 'Click to Upload or Drag',
                upload_subtitle: 'Paste supported (Ctrl+V)',
                url_placeholder: 'Enter image direct URL (https://...)',
                convert_btn: 'Convert',
                base64_placeholder: 'Paste Base64 string here...',
                base64_output: 'Base64 Output',
                length: 'Length',
                preview: 'Preview',
                download: 'Download',
                view_image: 'View Image',
                stat_total: 'Total Conversions',
                stat_ip: 'Verified IPs Today',
                admin_panel: 'Configuration',
                admin_login: 'Admin Login',
                password: 'Password',
                verify: 'Verify',
                settings_ui: 'Interface',
                label_site_name: 'Site Title',
                label_opacity: 'Card Opacity',
                label_bg_url: 'Background Image URL',
                settings_account: 'Account',
                label_new_pass: 'New Password',
                placeholder_pass: 'Leave empty to keep current',
                settings_turnstile: 'Turnstile',
                enable_turnstile: 'Enable Turnstile',
                site_key: 'Site Key',
                secret_key: 'Secret Key',
                verify_mode: 'Frequency',
                mode_always: 'Verify Every Time',
                mode_daily: 'Verify Once Per Day (IP)',
                save_config: 'Save Changes',
                saving: 'Saving...'
            }
        };

        function app() {
            return {
                lang: 'zh',
                activeTab: 'img2base',
                dragOver: false,
                previewUrl: null,
                base64Result: '',
                base64Input: '',
                imageUrlInput: '',
                loading: false,
                copyBtnText: 'Copy',
                
                titleClickCount: 0,
                clickTimer: null,
                showLogin: false,
                isAdminMode: false,
                hasLocalAdmin: false,
                loginPassword: '',
                savedPassword: '',
                saving: false,
                // 新增：通用模态框状态
                showModal: false,
                modalImageUrl: '',
                stats: {},
                
                config: ${JSON.stringify(config)},
                adminConfig: {},
                needsCaptcha: false,
                turnstileToken: null,

                t(key) { return i18n[this.lang][key] || key; },
                
                toggleLang() {
                    this.lang = this.lang === 'zh' ? 'en' : 'zh';
                    this.copyBtnText = this.lang === 'zh' ? '复制' : 'Copy';
                },

                // 通用图片查看器
                showImage(url) {
                    if (!url) return;
                    this.modalImageUrl = url;
                    this.showModal = true;
                },

                get formattedBase64() {
                    if (!this.base64Input) return '';
                    let val = this.base64Input.trim();
                    if (!val.startsWith('data:image')) return 'data:image/png;base64,' + val;
                    return val;
                },

                init() {
                    window.addEventListener('paste', e => this.handlePaste(e));
                    const localPass = localStorage.getItem('admin_pass_cache');
                    if (localPass) {
                        this.hasLocalAdmin = true;
                        this.savedPassword = localPass;
                    }
                    if (window.location.pathname === '/admin') {
                        this.hasLocalAdmin ? this.verifyAndEnter(this.savedPassword) : this.showLogin = true;
                    }
                    this.checkAuthRequirement();
                    this.copyBtnText = this.lang === 'zh' ? '复制' : 'Copy';
                },

                goHome() {
                    this.isAdminMode = false;
                    window.history.pushState({}, '', '/');
                },

                logout() {
                    localStorage.removeItem('admin_pass_cache');
                    this.hasLocalAdmin = false;
                    this.isAdminMode = false;
                    window.location.href = '/';
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
                    if(this.needsCaptcha) { alert(this.t('captcha_required')); return; }
                    if (file.size > 20 * 1024 * 1024) {
                        alert(this.lang === 'zh' ? '文件过大！请上传 20MB 以内的图片。' : 'File too large! Max 20MB allowed.');
                        return;
                    }
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
                    if(this.needsCaptcha) { alert(this.t('captcha_required')); return; }
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
                    } catch (e) { alert('Error: ' + e.message); } finally { this.loading = false; }
                },

                copyToClipboard() {
                    navigator.clipboard.writeText(this.base64Result).then(() => {
                        const original = this.copyBtnText;
                        this.copyBtnText = this.lang === 'zh' ? '已复制!' : 'Copied!';
                        setTimeout(() => this.copyBtnText = original, 2000);
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

                async login() { await this.verifyAndEnter(this.loginPassword); },

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
                        localStorage.setItem('admin_pass_cache', password);
                        this.loadAdminData();
                    } else {
                        if(!this.showLogin && this.hasLocalAdmin) {
                            this.hasLocalAdmin = false;
                            localStorage.removeItem('admin_pass_cache');
                            this.showLogin = true;
                        } else {
                            alert('Invalid Password');
                        }
                    }
                },

                enterAdminDirectly() {
                    this.verifyAndEnter(this.savedPassword);
                    window.history.pushState({}, '', '/admin');
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
                        alert('Password updated!');
                    } else {
                        alert(this.lang === 'zh' ? '已保存' : 'Saved');
                    }

                    this.saving = false;
                    this.config.site_name = this.adminConfig.site_name;
                    this.config.card_opacity = this.adminConfig.card_opacity;
                    this.config.bg_url = this.adminConfig.bg_url;
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
        
        const contentLength = imgRes.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 20 * 1024 * 1024) throw new Error('Image too large (>20MB)');

        const buffer = await imgRes.arrayBuffer();
        if (buffer.byteLength > 20 * 1024 * 1024) throw new Error('Image too large (>20MB)');
        
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        const base64 = btoa(binary);
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

  const authHeader = request.headers.get('X-Admin-Auth');
  const dbPass = await env.DB.prepare("SELECT value FROM config WHERE key = 'admin_password'").first('value');
  if (authHeader !== dbPass) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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
    let config = { site_name: 'Base64 Pro', bg_url: '', card_opacity: '0.9' };
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
