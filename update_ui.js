const fs = require('fs');
const file = '/home/million/Documents/maraki/telegram-mini-app/src/pages/voice/VoiceChatPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove Menu and Settings imports
content = content.replace(/  Menu,\n/g, '');
content = content.replace(/  Settings,\n/g, '');

// 2. Remove states
content = content.replace(/  const \[isSidebarOpen, setIsSidebarOpen\] = useState\(false\);\n/g, '');
content = content.replace(/  const \[isSettingsOpen, setIsSettingsOpen\] = useState\(false\);\n/g, '');

// 3. Remove Drawer and Modal
const startDrawer = content.indexOf('{/* Session Drawer Sidebar */}');
const endModal = content.indexOf('{/* Main App Container */}');
if (startDrawer !== -1 && endModal !== -1) {
  content = content.substring(0, startDrawer) + content.substring(endModal);
}

// 4. Update Header
const oldHeader = `        <header className="px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-xs">
              <MALogo className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-gray-900 leading-tight">Maraki AI</h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                VOICE & VIDEO COACH
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tgUser && (
              <div className="flex items-center gap-2 px-1.5 py-1.5 bg-gray-50/80 rounded-full border border-gray-100 shadow-xs animate-fadeIn">
                {(tgUser.photoUrl || tgUser.photo_url) ? (
                  <img src={tgUser.photoUrl || tgUser.photo_url} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] font-bold text-xs">
                    {(tgUser.firstName || tgUser.first_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-gray-700 max-w-[80px] truncate pr-2">
                  {tgUser.firstName || tgUser.first_name || tgUser.username || 'User'}
                </span>
              </div>
            )}
            
            {/* Settings gear button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Audio & Video Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>`;

const newHeader = `        <header className="px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-xs">
              <MALogo className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-gray-900 leading-tight">Maraki AI</h1>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                VOICE & VIDEO COACH
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tgUser && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50/80 rounded-full border border-gray-100 shadow-xs animate-fadeIn">
                <span className="text-xs font-bold text-gray-700 max-w-[100px] truncate pl-1">
                  {tgUser.firstName || tgUser.first_name || tgUser.username || 'User'}
                </span>
                {(tgUser.photoUrl || tgUser.photo_url) ? (
                  <img src={tgUser.photoUrl || tgUser.photo_url} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] font-bold text-xs">
                    {(tgUser.firstName || tgUser.first_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync(file, content);
console.log("UI updated successfully.");
