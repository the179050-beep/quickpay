import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import AnimatedElement from "@/components/AnimatedElement";
import AmbientBackground from "@/components/AmbientBackground";
import EezeeForm from "@/components/EezeeForm";
import BillForm from "@/components/BillForm";

const TABS = [
  { key: "bill", label: "دفع الفاتورة" },
  { key: "eezee", label: "إعادة تعبئة eeZee" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("eezee");
  const [additionalNumbers, setAdditionalNumbers] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const handleAddNumber = useCallback(() => {
    setAdditionalNumbers(prev => prev.length < 3 ? [...prev, ""] : prev);
  }, []);

  const handleRemoveNumber = useCallback((index) => {
    setAdditionalNumbers(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAdditionalChange = useCallback((index, value) => {
    setAdditionalNumbers(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }, []);

  const isBillTab = activeTab === "bill";

  return (
    <div dir="rtl" className="min-h-[80vh] relative font-body">
      <AmbientBackground />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer { 100% { transform: translateX(150%); } }
        @keyframes pulse-line { 0%,100% { transform: scaleX(0); opacity:0; } 50% { transform: scaleX(1); opacity:1; } }
      `}} />

      <div className="relative z-10 py-12 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[600px] mx-auto"
        >
          {/* Page Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-foreground tracking-tight inline-block relative">
              الدفع السريع
              <div className="absolute -bottom-2 left-1/4 right-1/4 h-0.5 bg-accent rounded-full opacity-50" />
            </h1>
          </div>

          <AnimatedElement delay={100}>
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 overflow-hidden mb-6 transition-all duration-300 hover:shadow-[0_12px_50px_rgb(0,0,0,0.08)]">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

              {/* Tabs */}
              <div className="flex border-b border-border/60">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-4 text-[15px] font-bold transition-all duration-300 relative ${
                      activeTab === tab.key
                        ? "text-accent bg-accent/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.key && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Form Area */}
              <div className="p-8">
                {isBillTab ? (
                  <BillForm
                    additionalNumbers={additionalNumbers}
                    onRemoveNumber={handleRemoveNumber}
                    onAdditionalChange={handleAdditionalChange}
                    submitted={submitted}
                    setSubmitted={setSubmitted}
                  />
                ) : (
                  <EezeeForm />
                )}
              </div>
            </div>
          </AnimatedElement>

          {/* Add Another Number — bill tab only */}
          {isBillTab && (
            <AnimatedElement delay={200}>
              <button
                type="button"
                onClick={handleAddNumber}
                disabled={additionalNumbers.length >= 3 || submitted}
                className="w-full bg-card/60 backdrop-blur-sm hover:bg-card border border-white/30 text-muted-foreground hover:text-foreground rounded-xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-300 mb-8 group disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
              >
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                <span>أضف رقم آخر</span>
              </button>
            </AnimatedElement>
          )}
        </motion.div>
      </div>
    </div>
  );
}