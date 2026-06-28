import React, { useState, useRef, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Upload, 
  Trash2, 
  Shuffle, 
  Eye, 
  User, 
  Check, 
  Award, 
  Image as ImageIcon,
  Palette,
  Smile,
  Scissors
} from 'lucide-react';
import UserAvatar, { 
  AvatarConfig,
  SKIN_TONES, 
  HAIR_STYLES, 
  HAIR_COLORS, 
  FACIAL_HAIR_OPTIONS, 
  EYE_COLORS, 
  GLASSES_OPTIONS, 
  HAT_OPTIONS, 
  ACCESSORY_OPTIONS, 
  EXPRESSIONS, 
  SHIRT_COLORS, 
  BG_COLORS, 
  ACCENT_COLORS, 
  ACHIEVEMENT_FRAMES,
  getDeterministicAvatarConfig
} from './UserAvatar';

interface AvatarCustomizerProps {
  config: AvatarConfig;
  onChange: (updatedConfig: AvatarConfig) => void;
  level: number;
}

type TabType = 'ill' | 'upload';
type CategoryType = 'skin' | 'hair' | 'eyes_acc' | 'clothing_bg' | 'frames';

export default function AvatarCustomizer({
  config,
  onChange,
  level
}: AvatarCustomizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ill');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('skin');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update helper
  const updateProp = (key: keyof AvatarConfig, value: any) => {
    const updated = {
      ...config,
      useCustomPhoto: activeTab === 'upload',
      [key]: value
    };
    onChange(updated);
  };

  // Randomized illustrated avatar generator
  const handleRandomize = () => {
    const seed = `random_${Date.now()}_${Math.random()}`;
    const randomConfig = getDeterministicAvatarConfig(seed);
    // Keep frame and custom photo flag if preferred
    randomConfig.frameId = config.frameId;
    randomConfig.useCustomPhoto = false;
    onChange(randomConfig);
  };

  // Handle local photo upload
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit file size to 2MB to keep local storage clean
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please upload a smaller profile image.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          const updated = {
            ...config,
            useCustomPhoto: true,
            customPhotoUrl: dataUrl
          };
          onChange(updated);
          setActiveTab('upload');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearPhoto = () => {
    const updated = {
      ...config,
      useCustomPhoto: false,
      customPhotoUrl: undefined
    };
    onChange(updated);
    setActiveTab('ill');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-5 md:p-6 shadow-xs space-y-6" id="avatar-customizer-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 font-display flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-indigo-500" /> Redesigned Profile Avatar
          </h3>
          <p className="text-xs text-slate-450 font-sans mt-0.5">Design a modern illustrated avatar or link your premium profile picture.</p>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200/40 w-max shrink-0">
          <button
            onClick={() => {
              setActiveTab('ill');
              updateProp('useCustomPhoto', false);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'ill' && !config.useCustomPhoto
                ? 'bg-white text-slate-800 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Illustrated
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              updateProp('useCustomPhoto', true);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'upload' || config.useCustomPhoto
                ? 'bg-white text-slate-800 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Photo Upload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: REAL-TIME PREVIEW */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Visual Preview</span>
          
          <div className="relative">
            <UserAvatar
              configOrUrl={config}
              size="2xl"
              level={level}
              showLevelBadge={true}
              animateLevelUp={true}
            />
          </div>

          <div className="text-center space-y-1">
            <span className="block text-xs font-mono text-slate-400 uppercase tracking-widest">Active Rank</span>
            <span className="block text-sm font-display font-extrabold text-indigo-600">Lv.{level} Campaigner</span>
          </div>

          {activeTab === 'ill' && (
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold shadow-3xs transition-all w-full justify-center"
              id="avatar-randomize-btn"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-500" /> Randomize Look
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: CUSTOMIZATION FIELDS */}
        <div className="lg:col-span-8 space-y-5">
          {activeTab === 'ill' && !config.useCustomPhoto ? (
            <div className="space-y-4" id="illustrated-customizer-controls">
              {/* CATEGORIES BUTTON RAIL */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'skin', label: 'Face', icon: User },
                  { id: 'hair', label: 'HairStyle', icon: Scissors },
                  { id: 'eyes_acc', label: 'Glasses', icon: Eye },
                  { id: 'clothing_bg', label: 'Backdrop', icon: Palette },
                  { id: 'frames', label: 'Unlocked Frame', icon: Award }
                ].map(cat => {
                  const Icon = cat.icon;
                  const isSel = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as CategoryType)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                        isSel
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* CATEGORY CONTROLS */}
              <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl min-h-[160px] flex flex-col justify-center">
                {/* 1. SKIN & EXPRESSIONS */}
                {activeCategory === 'skin' && (
                  <div className="space-y-4" id="customizer-skin-section">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Skin Tone Palette</span>
                      <div className="flex flex-wrap gap-2">
                        {SKIN_TONES.map(tone => (
                          <button
                            key={tone.id}
                            onClick={() => updateProp('skinTone', tone.id)}
                            title={tone.name}
                            className={`w-7 h-7 rounded-full transition-all border relative flex items-center justify-center ${
                              config.skinTone === tone.id
                                ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-indigo-500'
                                : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: tone.value }}
                          >
                            {config.skinTone === tone.id && <Check className="w-3.5 h-3.5 text-slate-800 font-extrabold" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Smile Expression</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {EXPRESSIONS.map(expr => (
                          <button
                            key={expr.id}
                            onClick={() => updateProp('expression', expr.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-left transition-all truncate ${
                              config.expression === expr.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {expr.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. HAIR STYLES, COLORS & BEARDS */}
                {activeCategory === 'hair' && (
                  <div className="space-y-4" id="customizer-hair-section">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Hair Style Shape</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {HAIR_STYLES.map(style => (
                          <button
                            key={style.id}
                            onClick={() => updateProp('hairStyle', style.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-left transition-all truncate ${
                              config.hairStyle === style.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {style.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Hair Dye Color</span>
                      <div className="flex flex-wrap gap-2">
                        {HAIR_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => updateProp('hairColor', color.id)}
                            title={color.name}
                            className={`w-7 h-7 rounded-full transition-all border relative flex items-center justify-center ${
                              config.hairColor === color.id
                                ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-indigo-500'
                                : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {config.hairColor === color.id && (
                              <Check className={`w-3.5 h-3.5 ${color.id === 'black' || color.id === 'dark_brown' ? 'text-white' : 'text-slate-800'}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Facial Hair / Beard</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {FACIAL_HAIR_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => updateProp('facialHair', opt.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-left transition-all truncate ${
                              config.facialHair === opt.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EYE COLOR, GLASSES & ACCESSORIES */}
                {activeCategory === 'eyes_acc' && (
                  <div className="space-y-4" id="customizer-eyes-section">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Iris Color</span>
                      <div className="flex flex-wrap gap-2">
                        {EYE_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => updateProp('eyeColor', color.id)}
                            title={color.name}
                            className={`w-7 h-7 rounded-full transition-all border relative flex items-center justify-center ${
                              config.eyeColor === color.id
                                ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-indigo-500'
                                : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {config.eyeColor === color.id && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Frame Glasses</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {GLASSES_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => updateProp('glasses', opt.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-left transition-all truncate ${
                              config.glasses === opt.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Hat Style</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {HAT_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => updateProp('hat', opt.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-left transition-all truncate ${
                              config.hat === opt.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tech Accessories</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {ACCESSORY_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => updateProp('accessories', opt.id)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-left transition-all truncate ${
                              config.accessories === opt.id
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. CLOTHING & BACKDROPS */}
                {activeCategory === 'clothing_bg' && (
                  <div className="space-y-4" id="customizer-clothing-section">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Active Shirt Palette</span>
                      <div className="flex flex-wrap gap-2">
                        {SHIRT_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => updateProp('shirtColor', color.id)}
                            title={color.name}
                            className={`w-7 h-7 rounded-full transition-all border relative flex items-center justify-center ${
                              config.shirtColor === color.id
                                ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-indigo-500'
                                : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {config.shirtColor === color.id && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Avatar Backdrop Color</span>
                      <div className="flex flex-wrap gap-2">
                        {BG_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => updateProp('bgColor', color.id)}
                            title={color.name}
                            className={`w-7 h-7 rounded-full transition-all border relative flex items-center justify-center ${
                              config.bgColor === color.id
                                ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-indigo-500'
                                : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {config.bgColor === color.id && <Check className="w-3.5 h-3.5 text-slate-800" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Backdrop Geometric Accent Line</span>
                      <div className="flex flex-wrap gap-2">
                        {ACCENT_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => updateProp('accentColor', color.id)}
                            title={color.name}
                            className={`w-7 h-7 rounded-full transition-all border relative flex items-center justify-center ${
                              config.accentColor === color.id
                                ? 'ring-2 ring-indigo-500 ring-offset-1 scale-110 border-indigo-500'
                                : 'border-slate-200'
                            }`}
                            style={{ backgroundColor: color.value }}
                          >
                            {config.accentColor === color.id && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. ACHIEVEMENT FRAMES */}
                {activeCategory === 'frames' && (
                  <div className="space-y-3" id="customizer-frames-section">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Select Your Unlocked Frame</span>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                      {ACHIEVEMENT_FRAMES.map(frame => {
                        const isSel = config.frameId === frame.id;
                        return (
                          <button
                            key={frame.id}
                            onClick={() => updateProp('frameId', frame.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                              isSel
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-3xs font-extrabold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {frame.icon ? (
                              <frame.icon className={`w-4 h-4 shrink-0 ${frame.color}`} />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-50 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="block text-xs truncate leading-none">{frame.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* UPLOAD PROFILE PHOTO CONTROLS */
            <div className="space-y-4 py-4" id="custom-photo-upload-controls">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-slate-50/50 space-y-3 group"
              >
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-indigo-100/50 shadow-3xs group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-bold text-slate-700">Drag and drop your profile photo here</span>
                  <span className="block text-[10px] text-slate-400 font-sans">Supports PNG, JPG (Max 2MB file size)</span>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs inline-block"
                >
                  Browse Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {config.customPhotoUrl && (
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img
                      src={config.customPhotoUrl}
                      alt="Uploaded thumbnail"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Active Custom Profile Photo</span>
                      <span className="block text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <Check className="w-3.5 h-3.5" /> Successfully Synced
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleClearPhoto}
                    className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove custom photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* UNLOCKED FRAME SELECTION ALSO WORKS WITH CUSTOM PHOTO! */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Frame Overlay for Uploaded Photo</span>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {ACHIEVEMENT_FRAMES.map(frame => {
                    const isSel = config.frameId === frame.id;
                    return (
                      <button
                        key={frame.id}
                        onClick={() => updateProp('frameId', frame.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                          isSel
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-3xs font-extrabold'
                            : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                        }`}
                      >
                        {frame.icon ? (
                          <frame.icon className={`w-4 h-4 shrink-0 ${frame.color}`} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-50 shrink-0" />
                        )}
                        <span className="text-xs truncate leading-none">{frame.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
