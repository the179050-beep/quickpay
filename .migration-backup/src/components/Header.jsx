import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Search, ChevronDown, Headset, ShoppingCart, SlidersHorizontal, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex flex-col w-full" dir="rtl">
      {/* Top Utility Bar */}
      <div className="bg-background border-b border-border transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
          <div className="flex items-center h-full">
            <div className="flex items-center h-full border-l border-border pl-4 ml-4">
              <div className="h-full bg-accent text-accent-foreground flex items-center px-6 font-bold text-sm">
                شخصي
              </div>
              <a href="#" className="h-full flex items-center px-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                الأعمال
              </a>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <a href="#" className="text-xs font-medium text-foreground hover:text-accent transition-colors">تحديث البطاقة المدنية</a>
              <Link to="/" className="text-xs font-medium text-foreground hover:text-accent transition-colors">الدفع السريع</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 h-full">
            <button className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-accent transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
              <span>الكويت</span>
            </button>
            <div className="w-px h-4 bg-border" />
            <button className="text-xs font-medium text-foreground hover:text-accent transition-colors">EN</button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`bg-primary transition-all duration-300 ${scrolled ? "shadow-xl shadow-primary/20" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center shrink-0">
              <Link to="/" className="flex items-center gap-2 group">
                <img
                  src="https://media.base44.com/images/public/6a07389b99ad1da7cc77d8a0/96daa83cc_myzain_kw_zain_com_Zain_logo_white70f534fa_6c281017.png"
                  alt="Zain"
                  className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.target.style.display = "none"; e.target.nextElementSibling.style.display = "inline"; }}
                />
                <span className="font-bold text-3xl text-primary-foreground tracking-tighter" style={{ display: "none" }}>Zain</span>
              </Link>
            </div>

            <div className="hidden sm:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center h-[72px]">
                <a href="#" className="h-full px-6 flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors group relative">
                  <ShoppingCart className="w-4 h-4" />
                  <span className="font-medium text-[15px]">تسوق</span>
                </a>
                <Link
                  to="/my-zain"
                  className={`h-full px-6 flex items-center gap-2 transition-colors relative group ${location.pathname === "/my-zain" ? "text-primary-foreground" : "text-primary-foreground/90 hover:text-primary-foreground"}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="font-medium text-[15px]">My Zain</span>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full transition-all duration-300 ${location.pathname === "/my-zain" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-50 group-hover:scale-x-100"}`} />
                </Link>
                <a href="#" className="h-full px-6 flex items-center gap-2 text-primary-foreground/90 hover:text-primary-foreground transition-colors group relative">
                  <Headset className="w-4 h-4" />
                  <span className="font-medium text-[15px]">الدعم</span>
                </a>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
              </button>
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-primary border-l-primary/50 w-[300px] p-0" dir="rtl">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-white/10">
                    <img src="https://media.base44.com/images/public/6a07389b99ad1da7cc77d8a0/96daa83cc_myzain_kw_zain_com_Zain_logo_white70f534fa_6c281017.png" alt="Zain" className="h-8 w-auto object-contain" />
                  </div>
                  <div className="flex flex-col py-4">
                    <a href="#" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-6 py-4 text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/5 transition-colors font-medium">
                      <ShoppingCart className="w-5 h-5" /> تسوق
                    </a>
                    <Link to="/my-zain" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-6 py-4 text-primary-foreground hover:bg-white/5 transition-colors font-medium relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-accent" />
                      <SlidersHorizontal className="w-5 h-5 text-accent" /> My Zain
                    </Link>
                    <a href="#" className="flex items-center gap-3 px-6 py-4 text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/5 transition-colors font-medium">
                      <Headset className="w-5 h-5" /> الدعم
                    </a>
                  </div>
                  <div className="mt-auto bg-black/20 p-6 flex flex-col gap-3">
                    <Link to="/" onClick={() => setMobileOpen(false)} className="block text-primary-foreground text-sm font-medium hover:text-accent transition-colors">الدفع السريع</Link>
                    <a href="#" className="block text-primary-foreground text-sm font-medium hover:text-accent transition-colors">تحديث البطاقة المدنية</a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}