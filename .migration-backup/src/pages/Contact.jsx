import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default function Contact() {
  return (
    <div dir="rtl" className="min-h-screen bg-background font-body">
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
          تواصل معنا
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          نحن هنا لمساعدتك. لا تتردد في التواصل معنا عبر أي من القنوات التالية.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mb-14">
          {[
            {
              icon: Mail,
              title: "البريد الإلكتروني",
              value: "support@zain.com.kw",
              sub: "نرد خلال 24 ساعة عمل",
              href: "mailto:support@zain.com.kw",
            },
            {
              icon: Phone,
              title: "خط الدعم",
              value: "107",
              sub: "متاح على مدار الساعة",
              href: "tel:107",
            },
            {
              icon: MessageCircle,
              title: "الدردشة المباشرة",
              value: "تحدث معنا الآن",
              sub: "عبر تطبيق My Zain",
              href: "#",
            },
            {
              icon: MapPin,
              title: "المقر الرئيسي",
              value: "برج زين، الكويت",
              sub: "شارع الشهداء، مجمع المرقاب",
              href: "#",
            },
          ].map(({ icon: Icon, title, value, sub, href }) => (
            <a
              key={title}
              href={href}
              className="flex items-start gap-4 bg-card border border-border rounded-xl p-5 shadow-sm hover:border-accent/50 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-0.5">{title}</p>
                <p className="text-base font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-5">أرسل لنا رسالة</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors"
                  placeholder="محمد الكويتي"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors"
                  placeholder="9XXXXXXX"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">الرسالة</label>
              <textarea
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:border-accent transition-colors resize-none"
                placeholder="اكتب رسالتك هنا..."
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-accent text-accent-foreground px-8 py-2.5 rounded-lg font-bold text-sm hover:bg-accent/90 transition-colors"
            >
              إرسال الرسالة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}