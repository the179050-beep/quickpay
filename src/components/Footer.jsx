import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img
                src="https://media.base44.com/images/public/6a07389b99ad1da7cc77d8a0/96daa83cc_myzain_kw_zain_com_Zain_logo_white70f534fa_6c281017.png"
                alt="Zain"
                className="h-8 w-auto object-contain"
                onError={(e) => { e.target.style.display = "none"; e.target.nextElementSibling.style.display = "inline"; }}
              />
              <span className="font-bold text-xl text-primary-foreground" style={{ display: "none" }}>Zain</span>
            </Link>
            <p className="text-primary-foreground/60 text-xs leading-relaxed">
              زين الكويت — شركة رائدة في مجال الاتصالات تقدم أفضل الخدمات والحلول التقنية.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-7 h-7 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors duration-200">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "خدماتنا", items: ["الباقات والعروض", "الإنترنت المنزلي", "المكالمات الدولية", "خدمات البيانات"] },
            { title: "My Zain", items: ["الدفع السريع", "إدارة الحساب", "الفواتير", "استهلاكي"] },
            { title: "الدعم", items: ["تواصل معنا", "الأسئلة الشائعة", "المتاجر", "الشكاوى"] },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-sm mb-4 text-primary-foreground">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-primary-foreground/60 text-xs hover:text-primary-foreground transition-colors duration-200">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {["سياسة الخصوصية", "الشروط والأحكام", "ملفات تعريف الارتباط"].map((link) => (
              <a key={link} href="#" className="text-primary-foreground/50 text-xs hover:text-primary-foreground/80 transition-colors">{link}</a>
            ))}
          </div>
          <p className="text-primary-foreground/40 text-xs">© 2024 Zain Kuwait. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}