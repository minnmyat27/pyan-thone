"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "my";

type Dict = typeof en;

const en = {
  langName: "English",
  nav: {
    home: "Home",
    products: "Products",
    forBuyers: "For Buyers",
    forSellers: "For Sellers",
    about: "About us",
    getStarted: "Get Started",
  },
  hero: {
    eyebrow: "Trusted second-hand marketplace",
    title: "Give your belongings a new life",
    desc: "Pyan Thone is a trusted second-hand marketplace with condition transparency and verified seller trust — buy and sell used products safely with people near you.",
    primary: "Get Started",
    secondary: "Browse marketplace",
  },
  stats: {
    sellers: "verified sellers",
    reused: "items reused",
    rating: "average rating",
  },
  products: {
    title: "What Pyan Thone offers",
    subtitle: "One account, two ways to use the marketplace.",
    buyers: {
      title: "For Buyers",
      desc: "Browse verified listings, read full condition reports, chat and make offers, then track delivery from order to arrival.",
      points: [
        "Condition evidence on every product",
        "Verified seller trust scores",
        "Protected chat, offers and payments",
      ],
      cta: "Explore marketplace",
    },
    sellers: {
      title: "For Sellers",
      desc: "Set up a storefront, verify your identity, publish listings with condition evidence, and manage orders and trust score from one dashboard.",
      points: [
        "List in under two minutes",
        "Build a public trust score",
        "Dashboard for orders and revenue",
      ],
      cta: "Open seller dashboard",
    },
  },
  about: {
    title: "About us",
    lead: "Pyan Thone exists to fix one thing: the trust gap in second-hand trading.",
    problemTag: "The problem",
    problemTitle: "A trust issue",
    problemBody:
      "Second-hand trading online is full of uncertainty. Listings hide defects, seller history is invisible, payments feel risky, and disputes have nowhere to go. Buyers overpay for worse-than-described items, and honest sellers can't stand out.",
    solutionTag: "Our solution",
    solutionTitle: "Transparency by default",
    solutionPoints: [
      "Condition evidence on every product — photos, a checklist, and diagnostics.",
      "Verified seller trust scores built from real sales and buyer reviews.",
      "Protected in-app chat and offers, with payment held until the buyer confirms.",
      "Delivery tracking and admin dispute review on every order.",
    ],
  },
  cta: {
    title: "Ready to give your belongings a new life?",
    desc: "Create your account and start buying or selling in minutes.",
    button: "Get Started",
  },
  footer: {
    tagline: "Trusted second-hand marketplace",
    rights: "Hackathon UI/UX · August 2026",
  },
  auth: {
    backHome: "← Back to Pyan Thone",
    login: {
      title: "Welcome back",
      subtitle: "Log in to continue buying and selling.",
      emailLabel: "Email or phone",
      passwordLabel: "Password",
      remember: "Remember me",
      forgot: "Forgot password?",
      submit: "Log in",
      alt: "Create account",
      terms: "By continuing, you agree to the Terms and Privacy Policy.",
      adminTitle: "Admin access",
      adminSubtitle: "Sign in with your authorized admin credentials.",
      adminSubmit: "Sign in securely",
      adminBack: "Back to home",
      adminNote: "Two-step verification and activity logging are required.",
    },
    signup: {
      title: "Create your account",
      subtitle: "Start buying or publish your first listing.",
      nameLabel: "Full name",
      namePlaceholder: "Your name",
      phoneLabel: "Phone number",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 8 characters",
      agree: "I agree to the Terms, Privacy Policy, and marketplace safety rules.",
      submit: "Create account",
      alt: "I already have an account",
    },
    otp: {
      title: "Verify your phone",
      sellerTitle: "Verify seller phone",
      subtitle: "We sent a 6-digit code to +95 9 ••• •• 6789.",
      label: "Enter verification code",
      submit: "Verify and continue",
      change: "Change phone number",
      expires: "Code expires in 04:32",
      resend: "Resend code",
      complete: "✓ Code complete — ready to verify",
      warn: "Never share this code with a seller, buyer, or support agent.",
    },
    role: {
      title: "Choose your role",
      subtitle: "You can add the other role later from account settings.",
      buyer: "Buyer",
      buyerDesc: "Browse trusted products, chat, make offers, track orders, and review sellers.",
      seller: "Seller",
      sellerDesc: "Create a shop, verify identity, publish listings, and manage customer orders.",
      continueBuyer: "Continue as buyer",
      setupSeller: "Set up seller account",
      back: "Back",
      note: "Buyer accounts require phone verification. Seller accounts also require a verified identity document.",
    },
  },
};

const my: Dict = {
  langName: "မြန်မာ",
  nav: {
    home: "ပင်မ",
    products: "ဝန်ဆောင်မှုများ",
    forBuyers: "ဝယ်သူများအတွက်",
    forSellers: "ရောင်းသူများအတွက်",
    about: "ကျွန်ုပ်တို့အကြောင်း",
    getStarted: "စတင်မည်",
  },
  hero: {
    eyebrow: "စိတ်ချရသော ဒုတိယလက် ဈေးကွက်",
    title: "အဟောင်းထဲက အသစ်တစ်ဖန် အသုံးဝင်မှုကို ရှာဖွေပါ",
    desc: "Pyan Thone သည် အခြေအနေ ပွင့်လင်းမြင်သာမှုနှင့် အတည်ပြုထားသော ရောင်းသူ ယုံကြည်မှုတို့ဖြင့် စိတ်ချရသော ဒုတိယလက် ဈေးကွက်ဖြစ်သည် — သင့်အနီးအနားရှိ လူများနှင့် လုံခြုံစွာ ဝယ်ယူ ရောင်းချနိုင်ပါသည်။",
    primary: "စတင်မည်",
    secondary: "ဈေးကွက် ကြည့်ရန်",
  },
  stats: {
    sellers: "အတည်ပြု ရောင်းသူ",
    reused: "ပြန်လည်အသုံးပြု ပစ္စည်း",
    rating: "ပျမ်းမျှ အဆင့်သတ်မှတ်ချက်",
  },
  products: {
    title: "Pyan Thone မှ ပေးဆောင်သည့် ဝန်ဆောင်မှုများ",
    subtitle: "အကောင့်တစ်ခုတည်းဖြင့် ဈေးကွက်ကို နည်းလမ်းနှစ်မျိုးဖြင့် အသုံးပြုနိုင်သည်။",
    buyers: {
      title: "ဝယ်သူများအတွက်",
      desc: "အတည်ပြုထားသော ကြော်ငြာများကို ကြည့်ရှုပါ၊ အခြေအနေ အစီရင်ခံစာ အပြည့်အစုံ ဖတ်ပါ၊ စကားပြောပြီး ဈေးဆစ်ပါ၊ ထို့နောက် အော်ဒါမှ လက်ခံရရှိသည်အထိ ပို့ဆောင်မှုကို ခြေရာခံပါ။",
      points: [
        "ပစ္စည်းတိုင်းအတွက် အခြေအနေ အထောက်အထား",
        "အတည်ပြု ရောင်းသူ ယုံကြည်မှု အမှတ်",
        "ကာကွယ်ထားသော စကားပြော၊ ဈေးဆစ်ခြင်းနှင့် ငွေပေးချေမှု",
      ],
      cta: "ဈေးကွက်သို့",
    },
    sellers: {
      title: "ရောင်းသူများအတွက်",
      desc: "ဆိုင်တစ်ခု ဖွင့်ပါ၊ သင့်မှတ်ပုံတင် အတည်ပြုပါ၊ အခြေအနေ အထောက်အထားနှင့်အတူ ကြော်ငြာတင်ပါ၊ အော်ဒါများနှင့် ယုံကြည်မှု အမှတ်ကို dashboard တစ်ခုတည်းမှ စီမံပါ။",
      points: [
        "နှစ်မိနစ်အတွင်း ကြော်ငြာတင်နိုင်",
        "အများမြင် ယုံကြည်မှု အမှတ် တည်ဆောက်ပါ",
        "အော်ဒါနှင့် ဝင်ငွေအတွက် Dashboard",
      ],
      cta: "ရောင်းသူ Dashboard",
    },
  },
  about: {
    title: "ကျွန်ုပ်တို့အကြောင်း",
    lead: "Pyan Thone သည် ဒုတိယလက် အရောင်းအဝယ်ရှိ ယုံကြည်မှု ကွာဟချက်ကို ဖြေရှင်းရန် တည်ရှိသည်။",
    problemTag: "ပြဿနာ",
    problemTitle: "ယုံကြည်မှု ပြဿနာ",
    problemBody:
      "အွန်လိုင်း ဒုတိယလက် အရောင်းအဝယ်တွင် မသေချာမှုများ များပြားသည်။ ကြော်ငြာများက ချို့ယွင်းချက်များကို ဖုံးကွယ်ထားသည်၊ ရောင်းသူ၏ မှတ်တမ်းကို မမြင်ရ၊ ငွေပေးချေမှုက အန္တရာယ်ရှိသလို ခံစားရပြီး အငြင်းပွားမှုများအတွက် ဖြေရှင်းရန် နေရာမရှိပါ။ ဝယ်သူများသည် ဖော်ပြထားသည်ထက် ညံ့သော ပစ္စည်းများအတွက် ပိုပေးရပြီး ရိုးသားသော ရောင်းသူများ ထင်ရှားခွင့် မရကြပါ။",
    solutionTag: "ကျွန်ုပ်တို့၏ ဖြေရှင်းချက်",
    solutionTitle: "ပွင့်လင်းမြင်သာမှုကို အခြေခံ",
    solutionPoints: [
      "ပစ္စည်းတိုင်းတွင် အခြေအနေ အထောက်အထား — ဓာတ်ပုံများ၊ စစ်ဆေးစာရင်းနှင့် diagnostics။",
      "အစစ်အမှန် အရောင်းနှင့် ဝယ်သူ သုံးသပ်ချက်များမှ တည်ဆောက်သော အတည်ပြု ရောင်းသူ ယုံကြည်မှု အမှတ်။",
      "ကာကွယ်ထားသော အက်ပ်အတွင်း စကားပြောခြင်းနှင့် ဈေးဆစ်ခြင်း၊ ဝယ်သူ အတည်ပြုသည်အထိ ငွေကို ထိန်းထားခြင်း။",
      "အော်ဒါတိုင်းအတွက် ပို့ဆောင်မှု ခြေရာခံခြင်းနှင့် admin အငြင်းပွားမှု စိစစ်ခြင်း။",
    ],
  },
  cta: {
    title: "အဟောင်းထဲက အသစ်တစ်ဖန် အသုံးဝင်မှုကို ရှာဖွေပါ",
    desc: "အကောင့်ဖွင့်ပြီး မိနစ်ပိုင်းအတွင်း ဝယ်ယူ ရောင်းချ စတင်ပါ။",
    button: "စတင်မည်",
  },
  footer: {
    tagline: "စိတ်ချရသော ဒုတိယလက် ဈေးကွက်",
    rights: "Hackathon UI/UX · ဩဂုတ် ၂၀၂၆",
  },
  auth: {
    backHome: "← Pyan Thone သို့ ပြန်သွားရန်",
    login: {
      title: "ပြန်လည်ကြိုဆိုပါသည်",
      subtitle: "ဝယ်ယူ ရောင်းချမှု ဆက်လုပ်ရန် အကောင့်ဝင်ပါ။",
      emailLabel: "အီးမေးလ် သို့ ဖုန်း",
      passwordLabel: "စကားဝှက်",
      remember: "မှတ်ထားပါ",
      forgot: "စကားဝှက် မေ့နေပါသလား?",
      submit: "အကောင့်ဝင်မည်",
      alt: "အကောင့်သစ် ဖွင့်မည်",
      terms: "ဆက်လက်လုပ်ဆောင်ခြင်းဖြင့် စည်းမျဉ်းများနှင့် ကိုယ်ရေးအချက်အလက် မူဝါဒကို သဘောတူပါသည်။",
      adminTitle: "Admin ဝင်ရောက်ခွင့်",
      adminSubtitle: "ခွင့်ပြုထားသော admin အထောက်အထားဖြင့် ဝင်ရောက်ပါ။",
      adminSubmit: "လုံခြုံစွာ ဝင်ရောက်မည်",
      adminBack: "ပင်မသို့ ပြန်သွားရန်",
      adminNote: "နှစ်ဆင့် အတည်ပြုခြင်းနှင့် လုပ်ဆောင်ချက် မှတ်တမ်းတင်ခြင်း လိုအပ်ပါသည်။",
    },
    signup: {
      title: "အကောင့် ဖန်တီးပါ",
      subtitle: "ဝယ်ယူမှု စတင်ပါ သို့မဟုတ် ပထမဆုံး ကြော်ငြာ တင်ပါ။",
      nameLabel: "အမည် အပြည့်အစုံ",
      namePlaceholder: "သင့်အမည်",
      phoneLabel: "ဖုန်းနံပါတ်",
      emailLabel: "အီးမေးလ်",
      passwordLabel: "စကားဝှက်",
      passwordPlaceholder: "အနည်းဆုံး စာလုံး ၈ လုံး",
      agree: "စည်းမျဉ်းများ၊ ကိုယ်ရေးအချက်အလက် မူဝါဒနှင့် ဈေးကွက် လုံခြုံရေး စည်းကမ်းများကို သဘောတူပါသည်။",
      submit: "အကောင့် ဖန်တီးမည်",
      alt: "အကောင့် ရှိပြီးသား ဖြစ်သည်",
    },
    otp: {
      title: "ဖုန်း အတည်ပြုပါ",
      sellerTitle: "ရောင်းသူ ဖုန်း အတည်ပြုပါ",
      subtitle: "+95 9 ••• •• 6789 သို့ ၆ လုံးပါ ကုဒ် ပို့လိုက်ပါသည်။",
      label: "အတည်ပြု ကုဒ် ထည့်ပါ",
      submit: "အတည်ပြု၍ ဆက်လုပ်မည်",
      change: "ဖုန်းနံပါတ် ပြောင်းရန်",
      expires: "ကုဒ် သက်တမ်း ကုန်ရန် 04:32",
      resend: "ကုဒ် ပြန်ပို့ရန်",
      complete: "✓ ကုဒ် ပြည့်စုံပါပြီ — အတည်ပြုရန် အသင့်",
      warn: "ဤကုဒ်ကို ရောင်းသူ၊ ဝယ်သူ သို့ support အား လုံးဝ မမျှဝေပါနှင့်။",
    },
    role: {
      title: "သင့် အခန်းကဏ္ဍ ရွေးပါ",
      subtitle: "အခြား အခန်းကဏ္ဍကို နောက်မှ အကောင့် ဆက်တင်တွင် ထည့်နိုင်ပါသည်။",
      buyer: "ဝယ်သူ",
      buyerDesc: "စိတ်ချရသော ပစ္စည်းများ ကြည့်ရှုပါ၊ စကားပြောပါ၊ ဈေးဆစ်ပါ၊ အော်ဒါ ခြေရာခံပါ၊ ရောင်းသူများကို သုံးသပ်ပါ။",
      seller: "ရောင်းသူ",
      sellerDesc: "ဆိုင်ဖွင့်ပါ၊ မှတ်ပုံတင် အတည်ပြုပါ၊ ကြော်ငြာ တင်ပါ၊ ဖောက်သည် အော်ဒါများ စီမံပါ။",
      continueBuyer: "ဝယ်သူအဖြစ် ဆက်လုပ်မည်",
      setupSeller: "ရောင်းသူ အကောင့် ပြင်ဆင်မည်",
      back: "နောက်သို့",
      note: "ဝယ်သူ အကောင့်များအတွက် ဖုန်း အတည်ပြုချက် လိုအပ်သည်။ ရောင်းသူ အကောင့်များအတွက် အတည်ပြုထားသော မှတ်ပုံတင် စာရွက်စာတမ်း ပါ လိုအပ်သည်။",
    },
  },
};

const DICTS: Record<Lang, Dict> = { en, my };
const STORAGE_KEY = "pyt.lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Dict };
const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: en });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "en" || saved === "my") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "my" ? "my" : "en";
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  return useContext(LanguageContext);
}
