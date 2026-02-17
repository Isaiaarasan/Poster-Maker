import React, { useState } from "react";
import { FaUser, FaPalette, FaCreditCard, FaKey, FaSave } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);

  // Load initial state or defaults
  // Load initial state or defaults
  const getInitialThemeMode = () => localStorage.getItem("pm_themeMode") || "dark";
  const getInitialTextMain = () => {
    const stored = localStorage.getItem("pm_textMain");
    if (stored) return stored;
    return getInitialThemeMode() === "light" ? "#0f172a" : "#ffffff";
  };

  const [settings, setSettings] = useState({
    appName: localStorage.getItem("pm_appName") || "Poster Maker",
    supportEmail:
      localStorage.getItem("pm_supportEmail") || "support@example.com",
    primaryColor: localStorage.getItem("pm_primaryColor") || "#8b5cf6",
    secondaryColor: localStorage.getItem("pm_secondaryColor") || "#3b82f6",
    bgPrimary: localStorage.getItem("pm_bgPrimary") || "#050505",
    bgSecondary: localStorage.getItem("pm_bgSecondary") || "#0f0f11",
    themeMode: getInitialThemeMode(),
    themeName: localStorage.getItem("pm_themeName") || "custom",
    textMain: getInitialTextMain(),
    privacyUrl: localStorage.getItem("pm_privacyUrl") || "",
    termsUrl: localStorage.getItem("pm_termsUrl") || "",
  });

  const tabs = [
    { id: "general", label: "General", icon: <FaUser /> },
    { id: "defaults", label: "Appearance", icon: <FaPalette /> },
    { id: "legal", label: "Legal & Privacy", icon: <FaKey /> },
  ];

  const handleChange = (key, value) => {
    // Real-time preview and Logic
    const root = document.documentElement;

    if (key === "themeMode") {
      let newDefaults = {};
      if (value === "light") {
        root.classList.add("light");
        newDefaults = {
          bgPrimary: "#f8fafc",
          bgSecondary: "#ffffff",
          textMain: "#0f172a",
        };
        root.style.setProperty("--border-color", "#e2e8f0");
      } else {
        root.classList.remove("light");
        newDefaults = {
          bgPrimary: "#050505",
          bgSecondary: "#0f0f11",
          textMain: "#ffffff",
        };
        root.style.setProperty("--border-color", "rgba(255, 255, 255, 0.1)");
      }
      // Update State with new defaults
      setSettings((prev) => ({ ...prev, [key]: value, ...newDefaults }));

      // Update CSS Variables immediately for these defaults
      root.style.setProperty("--bg-primary", newDefaults.bgPrimary);
      root.style.setProperty("--bg-secondary", newDefaults.bgSecondary);
      root.style.setProperty("--text-main", newDefaults.textMain);
      return;
    }

    const additionalUpdates = ["primaryColor", "secondaryColor", "bgPrimary", "bgSecondary", "textMain"].includes(key)
      ? { themeName: "custom" }
      : {};

    setSettings((prev) => ({ ...prev, [key]: value, ...additionalUpdates }));

    if (key === "primaryColor") root.style.setProperty("--primary", value);
    if (key === "secondaryColor") root.style.setProperty("--secondary", value);
    if (key === "bgPrimary") root.style.setProperty("--bg-primary", value);
    if (key === "bgSecondary") root.style.setProperty("--bg-secondary", value);
    if (key === "textMain") root.style.setProperty("--text-main", value);
  };

  const themeMap = {
    Alexa: {
      primaryColor: "#05A0D1",
      bgPrimary: "#000000",
      bgSecondary: "#232F3E",
      textMain: "#FAFAFA",
      themeMode: "dark",
      secondaryColor: "#3b82f6",
    },
    Netflix: {
      primaryColor: "#E50914",
      secondaryColor: "#221f1f",
      bgPrimary: "#000000",
      bgSecondary: "#141414",
      textMain: "#FFFFFF",
      themeMode: "dark",
    },
    Flipkart: {
      primaryColor: "#2874F0",
      secondaryColor: "#FFCC00",
      bgPrimary: "#FFFFFF",
      bgSecondary: "#F8FAFC",
      textMain: "#0F172A",
      themeMode: "light",
    },
    YouTube: {
      primaryColor: "#FF0000",
      secondaryColor: "#282828",
      bgPrimary: "#FFFFFF",
      bgSecondary: "#F9F9F9",
      textMain: "#0F172A",
      themeMode: "light",
    },
    Instagram: {
      primaryColor: "#E1306C",
      secondaryColor: "#405DE6",
      bgPrimary: "#FFFFFF",
      bgSecondary: "#FFF7FA",
      textMain: "#0F172A",
      themeMode: "light",
    },
    Facebook: {
      primaryColor: "#1877F2",
      secondaryColor: "#4267B2",
      bgPrimary: "#FFFFFF",
      bgSecondary: "#F2F6FF",
      textMain: "#0F172A",
      themeMode: "light",
    },
    Threads: {
      primaryColor: "#00AF87",
      secondaryColor: "#2DCCB7",
      bgPrimary: "#0F172A",
      bgSecondary: "#071521",
      textMain: "#FFFFFF",
      themeMode: "dark",
    },
    Snapchat: {
      primaryColor: "#FFFC00",
      secondaryColor: "#000000",
      bgPrimary: "#FFFFFF",
      bgSecondary: "#FFFDF0",
      textMain: "#0F172A",
      themeMode: "light",
    },
  };

  const applyTheme = (name) => {
    if (name === "custom") {
      setSettings((prev) => ({ ...prev, themeName: "custom" }));
      return;
    }

    const t = themeMap[name];
    if (!t) return;

    const themeData = { ...t, themeName: name };
    setSettings((prev) => ({ ...prev, ...themeData }));

    const root = document.documentElement;
    if (t.primaryColor) root.style.setProperty("--primary", t.primaryColor);
    if (t.secondaryColor)
      root.style.setProperty("--secondary", t.secondaryColor);
    if (t.bgPrimary) root.style.setProperty("--bg-primary", t.bgPrimary);
    if (t.bgSecondary)
      root.style.setProperty("--bg-secondary", t.bgSecondary);
    if (t.textMain) root.style.setProperty("--text-main", t.textMain);

    if (t.themeMode === "light") {
      root.classList.add("light");
      root.style.setProperty("--border-color", "#e2e8f0");
    } else {
      root.classList.remove("light");
      root.style.setProperty("--border-color", "rgba(255, 255, 255, 0.1)");
    }
  };

  const handleSave = () => {
    setLoading(true);
    // Persist to localStorage
    Object.keys(settings).forEach((key) => {
      localStorage.setItem(`pm_${key}`, settings[key]);
    });

    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <h1 className="text-3xl font-bold text-text-main mb-8">Settings</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Tabs */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "text-slate-400 hover:text-text-main hover:bg-bg-secondary"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-bg-secondary border border-border rounded-2xl p-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "general" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text-main mb-6">
                    General Information
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        Application Name
                      </label>
                      <input
                        type="text"
                        value={settings.appName}
                        onChange={(e) =>
                          handleChange("appName", e.target.value)
                        }
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) =>
                          handleChange("supportEmail", e.target.value)
                        }
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        "Saving..."
                      ) : (
                        <>
                          <FaSave /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "defaults" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-main">
                      Appearance & Branding
                    </h2>
                    <div className="flex items-center gap-3">
                      <select
                        value={settings.themeName}
                        onChange={(e) => applyTheme(e.target.value)}
                        className="bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-main"
                      >
                        <option value="custom">Custom</option>
                        <option value="Alexa">Alexa</option>
                        <option value="Netflix">Netflix</option>
                        <option value="Flipkart">Flipkart</option>
                        <option value="YouTube">YouTube</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Threads">Threads</option>
                        <option value="Snapchat">Snapchat</option>
                      </select>

                      {/* <button
                        onClick={() => applyTheme("Alexa")}
                        className="px-3 py-2 bg-[#05A0D1] text-white text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-2 shadow-lg shadow-[#05A0D1]/20"
                      >
                        <FaPalette /> Alexa
                      </button>

                      <button
                        onClick={() => applyTheme("Netflix")}
                        className="px-3 py-2 bg-[#E50914] text-white text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-2 shadow-lg shadow-[#E50914]/20"
                      >
                        <FaPalette /> Netflix
                      </button>

                      <button
                        onClick={() => applyTheme("Flipkart")}
                        className="px-3 py-2 bg-[#2874F0] text-white text-xs font-bold rounded-lg hover:brightness-110 flex items-center gap-2 shadow-lg shadow-[#2874F0]/20"
                      >
                        <FaPalette /> Flipkart
                      </button> */}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-slate-400">
                      Theme Base
                    </label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleChange("themeMode", "dark")}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${settings.themeMode === "dark" ? "border-primary bg-bg-tertiary" : "border-transparent bg-bg-tertiary opacity-50 hover:opacity-100"}`}
                      >
                        <div className="flex justify-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700"></div>
                        </div>
                        <p
                          className={`text-center text-sm font-bold ${settings.themeMode === "dark" ? "text-primary" : "text-slate-400"}`}
                        >
                          Dark
                        </p>
                      </button>
                      <button
                        onClick={() => handleChange("themeMode", "light")}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${settings.themeMode === "light" ? "border-primary bg-slate-100" : "border-transparent bg-slate-100 opacity-50 hover:opacity-100"}`}
                      >
                        <div className="flex justify-center mb-2">
                          <div className="w-8 h-8 rounded-full bg-white border border-slate-200"></div>
                        </div>
                        <p
                          className={`text-center text-sm font-bold ${settings.themeMode === "light" ? "text-primary" : "text-slate-500"}`}
                        >
                          Light
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) =>
                            handleChange("primaryColor", e.target.value)
                          }
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) =>
                            handleChange("primaryColor", e.target.value)
                          }
                          className="flex-1 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        Text Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.textMain}
                          onChange={(e) =>
                            handleChange("textMain", e.target.value)
                          }
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={settings.textMain}
                          onChange={(e) =>
                            handleChange("textMain", e.target.value)
                          }
                          className="flex-1 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        App Background
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.bgPrimary}
                          onChange={(e) =>
                            handleChange("bgPrimary", e.target.value)
                          }
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={settings.bgPrimary}
                          onChange={(e) =>
                            handleChange("bgPrimary", e.target.value)
                          }
                          className="flex-1 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-sm text-text-main"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        Sidebar/Card Background
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.bgSecondary}
                          onChange={(e) =>
                            handleChange("bgSecondary", e.target.value)
                          }
                          className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                          type="text"
                          value={settings.bgSecondary}
                          onChange={(e) =>
                            handleChange("bgSecondary", e.target.value)
                          }
                          className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-main"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 col-span-1 md:col-span-2 pt-4 border-t border-border">
                      <label className="text-sm font-medium text-slate-400">
                        Secondary Accent Color
                      </label>
                      <p className="text-xs text-slate-500 mb-2">
                        Used for gradients, secondary buttons, and highlights.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl border border-border shadow-lg bg-gradient-to-br from-primary to-secondary"></div>
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="color"
                            value={settings.secondaryColor}
                            onChange={(e) =>
                              handleChange("secondaryColor", e.target.value)
                            }
                            className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                          <input
                            type="text"
                            value={settings.secondaryColor}
                            onChange={(e) =>
                              handleChange("secondaryColor", e.target.value)
                            }
                            className="flex-1 bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-main"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        "Saving..."
                      ) : (
                        <>
                          <FaSave /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "legal" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text-main mb-6">
                    Legal & Privacy
                  </h2>
                  <p className="text-slate-400 text-sm mb-4">
                    Configure links that appear in the generated posters or
                    footers.
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        Privacy Policy URL
                      </label>
                      <input
                        type="url"
                        value={settings.privacyUrl}
                        onChange={(e) =>
                          handleChange("privacyUrl", e.target.value)
                        }
                        placeholder="https://..."
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">
                        Terms of Service URL
                      </label>
                      <input
                        type="url"
                        value={settings.termsUrl}
                        onChange={(e) =>
                          handleChange("termsUrl", e.target.value)
                        }
                        placeholder="https://..."
                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 text-text-main focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      {loading ? (
                        "Saving..."
                      ) : (
                        <>
                          <FaSave /> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
