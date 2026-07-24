const fs = require('fs');

const path = 'c:\\mailmassprom\\components\\email\\EmailPlatform.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Refactor sidebar categories
const oldSidebar = \`  {/* 📏 SEZIONI LAYOUT */}
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        📏 Sezioni Layout
      </h4>
    </div>
    
    <div className="space-y-3">
      {contentBlocks
        .filter(b => b.category === 'layout')
        .map((block) => (
          <motion.div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(block, e)}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-grab hover:border-blue-500 hover:shadow-md transition-all group active:cursor-grabbing"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl shrink-0">{block.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                  {block.name}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {block.description}
                </p>
              </div>
              <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
            </div>
          </motion.div>
      ))}
    </div>
  </div>

  {/* 🧱 ELEMENTI BASE */}
  <div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        🧱 Elementi Base
      </h4>
    </div>
    
    <div className="space-y-3">
      {contentBlocks
        .filter(b => b.category === 'basic')
        .map((block) => (\`;

const renderBlockList = (categoryTitle, icon, filterFn) => \`
  {/* \${categoryTitle} */}
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        \${icon} \${categoryTitle}
      </h4>
    </div>
    <div className="space-y-2">
      {contentBlocks
        .filter(\${filterFn})
        .map((block) => (
          <motion.div
            key={block.id}
            draggable
            onDragStart={(e) => handleDragStart(block, e)}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-grab hover:border-blue-500 hover:shadow-md transition-all group active:cursor-grabbing"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl shrink-0">{block.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">
                  {block.name}
                </h4>
              </div>
              <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" />
            </div>
          </motion.div>
      ))}
    </div>
  </div>
\`;

const newSidebar = 
  renderBlockList('Header', '🔝', "b => ['header', 'section-hero'].includes(b.id)") +
  renderBlockList('Body (Layouts)', '📝', "b => ['section-1col', 'section-2col', 'section-3col', 'section-imgtext', 'section-textimg', 'section-testimonial', 'section-cta'].includes(b.id)") +
  renderBlockList('Footer', '🔽', "b => ['social', 'link-block'].includes(b.id)") +
  renderBlockList('Elementi Base', '🧱', "b => ['image', 'text', 'button', 'divider'].includes(b.id)") + 
  \`{false && contentBlocks.filter(b => b.category === 'basic').map((block) => (\`;

// 2. Refactor Top Bar buttons
const oldTopBar = \`              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Template Builder</h2>
                  <p className="text-green-100">Costruisci la tua email con blocchi personalizzati</p>
                </div>
                <button
                  onClick={handleGoBack}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>\`;

const newTopBar = \`              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Template Builder</h2>
                  <p className="text-green-100">Costruisci la tua email con blocchi personalizzati</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition font-medium flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Anteprima
                  </button>
                  <button
                    onClick={() => {
                      const templateHTML = canvasBlocks.map((b) => b.html).join('\\n');
                      const templateData = {
                        id: 'custom-' + Date.now(),
                        name: 'Mio Template ' + new Date().toLocaleDateString(),
                        html: templateHTML,
                        color: '#6B7280',
                        category: 'custom'
                      };
                      const saved = JSON.parse(localStorage.getItem('userSavedTemplates') || '[]');
                      saved.push(templateData);
                      localStorage.setItem('userSavedTemplates', JSON.stringify(saved));
                      toast.success('💾 Template salvato correttamente in locale!');
                    }}
                    className="bg-white text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Salva Template
                  </button>
                  <button
                    onClick={handleGoBack}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition ml-2"
                    title="Chiudi Builder"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>\`;

content = content.replace(oldSidebar, newSidebar);
content = content.replace(oldTopBar, newTopBar);

// Update userSavedTemplates loading into predefinedTemplates if it doesn't exist
// Find \`const predefinedTemplates = [...templates];\` and append local storage loading
const oldPredefTemplates = \`const predefinedTemplates = [...templates];\`;
const newPredefTemplates = \`const predefinedTemplates = [...templates];
  // Carica i template salvati dall'utente
  if (typeof window !== 'undefined') {
    try {
      const saved = JSON.parse(localStorage.getItem('userSavedTemplates') || '[]');
      if (saved.length > 0) {
        predefinedTemplates.unshift(...saved);
      }
    } catch(e) {}
  }\`;
content = content.replace(oldPredefTemplates, newPredefTemplates);

fs.writeFileSync(path, content, 'utf8');
console.log('Builder Sidebar and Headers updated successfully!');
