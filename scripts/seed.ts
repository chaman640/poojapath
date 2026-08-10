/**
 * Demo content seed — `npm run db:seed`
 *
 * Ye script baar-baar chalayi ja sakti hai. Jo record pehle se hai
 * (slug ke hisaab se) usko update karti hai, naya nahi banati.
 * Aap admin panel se apna content daal dein — phir isko chalane ki
 * zaroorat nahi rahegi.
 */
import "./load-env";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import {
  adminUsers,
  categories,
  faqs,
  offerings,
  packages,
  products,
  pujas,
  temples,
  testimonials,
} from "../src/db/schema";

const DAY = 86_400_000;
const at = (daysFromNow: number, hour = 8) => {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { slug: "dosh-nivaran", nameEn: "Dosh Nivaran", nameHi: "दोष निवारण", icon: "chakra", order: 1 },
  { slug: "shiv-puja", nameEn: "Shiv Puja", nameHi: "शिव पूजा", icon: "shivling", order: 2 },
  { slug: "dhan-samriddhi", nameEn: "Wealth & Prosperity", nameHi: "धन-समृद्धि", icon: "kalash", order: 3 },
  { slug: "grah-shanti", nameEn: "Grah Shanti", nameHi: "ग्रह शांति", icon: "sun", order: 4 },
  { slug: "pitru-karya", nameEn: "Pitru Karya", nameHi: "पितृ कार्य", icon: "peepal", order: 5 },
  { slug: "shakti-puja", nameEn: "Shakti Puja", nameHi: "शक्ति पूजा", icon: "yantra", order: 6 },
  { slug: "santan-vivah", nameEn: "Santan & Vivah", nameHi: "संतान व विवाह", icon: "lotus", order: 7 },
  { slug: "hanuman-puja", nameEn: "Hanuman Puja", nameHi: "हनुमान पूजा", icon: "gada", order: 8 },
];

/* ------------------------------------------------------------------ */
/*  Temples                                                            */
/* ------------------------------------------------------------------ */

const TEMPLES = [
  {
    slug: "trayambakeshwar-nasik",
    nameEn: "Trayambakeshwar Jyotirlinga",
    nameHi: "त्र्यंबकेश्वर ज्योतिर्लिंग",
    cityEn: "Nashik", cityHi: "नासिक", stateEn: "Maharashtra", stateHi: "महाराष्ट्र",
    aboutEn:
      "One of the twelve Jyotirlingas, situated at the source of the Godavari. It is the only place where Narayan Nagbali, Kaal Sarp Shanti and Tripindi Shraddh are prescribed by shastra.",
    aboutHi:
      "बारह ज्योतिर्लिंगों में से एक, गोदावरी के उद्गम पर स्थित। शास्त्रों के अनुसार नारायण नागबलि, कालसर्प शांति एवं त्रिपिंडी श्राद्ध केवल यहीं विधिवत संपन्न होते हैं।",
  },
  {
    slug: "mahakaleshwar-ujjain",
    nameEn: "Shri Mahakaleshwar Jyotirlinga",
    nameHi: "श्री महाकालेश्वर ज्योतिर्लिंग",
    cityEn: "Ujjain", cityHi: "उज्जैन", stateEn: "Madhya Pradesh", stateHi: "मध्य प्रदेश",
    aboutEn:
      "The swayambhu Jyotirlinga of Avantika, famed for the Bhasma Aarti. Ujjain is considered the kaal-chakra centre of Bharat.",
    aboutHi:
      "अवंतिका का स्वयंभू ज्योतिर्लिंग, भस्म आरती के लिए विख्यात। उज्जैन को भारत का काल-चक्र केंद्र माना जाता है।",
  },
  {
    slug: "kashi-vishwanath",
    nameEn: "Kashi Vishwanath Dham",
    nameHi: "काशी विश्वनाथ धाम",
    cityEn: "Varanasi", cityHi: "वाराणसी", stateEn: "Uttar Pradesh", stateHi: "उत्तर प्रदेश",
    aboutEn:
      "The eternal city of Mahadev on the banks of Ganga. Pujas here are considered fruitful for moksha and release from long-standing karmic burdens.",
    aboutHi:
      "गंगा तट पर बसी महादेव की अविनाशी नगरी। यहाँ की पूजा मोक्ष एवं दीर्घकालीन कर्म-बंधन से मुक्ति हेतु फलदायी मानी जाती है।",
  },
  {
    slug: "vishnupad-gaya",
    nameEn: "Vishnupad Temple",
    nameHi: "विष्णुपद मंदिर",
    cityEn: "Gaya", cityHi: "गया", stateEn: "Bihar", stateHi: "बिहार",
    aboutEn:
      "The foremost tirth for Pind Daan and Pitru Karya, where Lord Vishnu's footprint is enshrined on the banks of the Falgu.",
    aboutHi:
      "पिंडदान एवं पितृ कार्य का सर्वोपरि तीर्थ, जहाँ फल्गु तट पर भगवान विष्णु के चरण-चिह्न विराजमान हैं।",
  },
  {
    slug: "mehandipur-balaji",
    nameEn: "Shri Mehandipur Balaji Dham",
    nameHi: "श्री मेहंदीपुर बालाजी धाम",
    cityEn: "Dausa", cityHi: "दौसा", stateEn: "Rajasthan", stateHi: "राजस्थान",
    aboutEn:
      "The most revered Hanuman kshetra for protection from negative energy, obstacles and nazar dosh.",
    aboutHi:
      "नकारात्मक ऊर्जा, बाधा एवं नज़र दोष से रक्षा हेतु सर्वाधिक पूजनीय हनुमान क्षेत्र।",
  },
  {
    slug: "peetambara-datia",
    nameEn: "Maa Baglamukhi Peetambara Shaktipeeth",
    nameHi: "माँ बगलामुखी पीतांबरा शक्तिपीठ",
    cityEn: "Datia", cityHi: "दतिया", stateEn: "Madhya Pradesh", stateHi: "मध्य प्रदेश",
    aboutEn:
      "The Shaktipeeth of Maa Baglamukhi, worshipped for victory in disputes, court cases and protection from adversaries.",
    aboutHi:
      "माँ बगलामुखी का शक्तिपीठ — विवाद, न्यायालयीन प्रकरण में विजय एवं शत्रु-बाधा से रक्षा हेतु पूजित।",
  },
  {
    slug: "mahalaxmi-kolhapur",
    nameEn: "Shri Mahalaxmi Ambabai Temple",
    nameHi: "श्री महालक्ष्मी अंबाबाई मंदिर",
    cityEn: "Kolhapur", cityHi: "कोल्हापुर", stateEn: "Maharashtra", stateHi: "महाराष्ट्र",
    aboutEn:
      "A Shakti Peeth of Maa Mahalaxmi, worshipped for wealth, business growth and removal of financial blockages.",
    aboutHi:
      "माँ महालक्ष्मी का शक्तिपीठ — धन, व्यापार वृद्धि एवं आर्थिक बाधा निवारण हेतु पूजित।",
  },
  {
    slug: "rishikesh-neelkanth",
    nameEn: "Neelkanth Mahadev Temple",
    nameHi: "नीलकंठ महादेव मंदिर",
    cityEn: "Rishikesh", cityHi: "ऋषिकेश", stateEn: "Uttarakhand", stateHi: "उत्तराखंड",
    aboutEn:
      "Where Mahadev consumed the halahal vish. Rudrabhishek here is regarded as especially potent for health and longevity.",
    aboutHi:
      "जहाँ महादेव ने हलाहल विष ग्रहण किया। यहाँ का रुद्राभिषेक आरोग्य एवं दीर्घायु हेतु विशेष फलदायी माना जाता है।",
  },
  {
    slug: "ayodhya-dham",
    nameEn: "Shri Ram Janmabhoomi, Ayodhya",
    nameHi: "श्री राम जन्मभूमि, अयोध्या",
    cityEn: "Ayodhya", cityHi: "अयोध्या", stateEn: "Uttar Pradesh", stateHi: "उत्तर प्रदेश",
    aboutEn:
      "The birthplace of Maryada Purushottam Shri Ram on the banks of the Sarayu.",
    aboutHi: "सरयू तट पर मर्यादा पुरुषोत्तम श्री राम की जन्मभूमि।",
  },
  {
    slug: "shani-shingnapur",
    nameEn: "Shri Shani Shingnapur",
    nameHi: "श्री शनि शिंगणापुर",
    cityEn: "Ahmednagar", cityHi: "अहमदनगर", stateEn: "Maharashtra", stateHi: "महाराष्ट्र",
    aboutEn:
      "The swayambhu Shani kshetra, where tel abhishek is performed for relief from Sade Sati and Shani Mahadasha.",
    aboutHi:
      "स्वयंभू शनि क्षेत्र, जहाँ साढ़े साती एवं शनि महादशा से राहत हेतु तेल अभिषेक किया जाता है।",
  },
];

/* ------------------------------------------------------------------ */
/*  Pujas                                                              */
/* ------------------------------------------------------------------ */

type SeedPackage = {
  nameEn: string; nameHi: string; price: number; mrp?: number; maxMembers: number;
  featuresEn: string[]; featuresHi: string[]; isPopular?: boolean;
};

type SeedPuja = {
  slug: string; titleEn: string; titleHi: string;
  subtitleEn: string; subtitleHi: string;
  descriptionEn: string; descriptionHi: string;
  benefitsEn: string[]; benefitsHi: string[];
  ritualsEn: string[]; ritualsHi: string[];
  artKey: string; days: number; temple: string; category: string;
  featured?: boolean; seats?: number; order: number;
  packages: SeedPackage[];
};

const pkgSet = (base: number): SeedPackage[] => [
  {
    nameEn: "Individual", nameHi: "एकल",
    price: base, mrp: Math.round(base * 1.4), maxMembers: 1,
    featuresEn: ["Sankalp with 1 name & gotra", "Full puja video on WhatsApp", "Temple prasad delivered", "Puja completion certificate"],
    featuresHi: ["1 नाम व गोत्र से संकल्प", "व्हाट्सएप पर पूरा पूजा वीडियो", "मंदिर का प्रसाद घर तक", "पूजा संपन्नता प्रमाण-पत्र"],
  },
  {
    nameEn: "Family (up to 4)", nameHi: "परिवार (4 तक)",
    price: Math.round(base * 1.9), mrp: Math.round(base * 2.6), maxMembers: 4,
    featuresEn: ["Sankalp with 4 names & gotra", "Full puja video on WhatsApp", "Extra prasad packet", "Priority pandit allocation", "Puja completion certificate"],
    featuresHi: ["4 नाम व गोत्र से संकल्प", "व्हाट्सएप पर पूरा पूजा वीडियो", "अतिरिक्त प्रसाद पैकेट", "प्राथमिकता से पंडित जी", "पूजा संपन्नता प्रमाण-पत्र"],
    isPopular: true,
  },
  {
    nameEn: "Sampoorna (up to 8)", nameHi: "संपूर्ण (8 तक)",
    price: Math.round(base * 3.4), mrp: Math.round(base * 4.5), maxMembers: 8,
    featuresEn: ["Sankalp with 8 names & gotra", "Dedicated pandit & extended jaap", "Personal video call darshan", "Premium prasad hamper", "Free follow-up jyotish consultation"],
    featuresHi: ["8 नाम व गोत्र से संकल्प", "समर्पित पंडित जी व विस्तृत जाप", "वीडियो कॉल पर व्यक्तिगत दर्शन", "प्रीमियम प्रसाद हैम्पर", "निःशुल्क ज्योतिष परामर्श"],
  },
];

const PUJAS: SeedPuja[] = [
  {
    slug: "kaal-sarp-dosh-nivaran-trayambakeshwar",
    titleEn: "Kaal Sarp Dosh Nivaran Puja",
    titleHi: "कालसर्प दोष निवारण पूजा",
    subtitleEn: "Break the cycle of repeated obstacles and stalled progress",
    subtitleHi: "बार-बार आने वाली बाधाओं और रुकी हुई प्रगति से मुक्ति",
    descriptionEn:
      "When all seven planets fall between Rahu and Ketu in a birth chart, Kaal Sarp Dosh is formed. Its effect shows up as effort that never converts into result — jobs that slip away at the last moment, deals that break, recurring health trouble and disturbed sleep. Trayambakeshwar is the shastra-prescribed kshetra for its nivaran. Our pandits perform the complete vidhi with Naag pratima puja, Rahu-Ketu shanti jaap and havan, taking your name and gotra in the sankalp.",
    descriptionHi:
      "जब जन्म कुंडली में सातों ग्रह राहु और केतु के बीच आ जाते हैं तो कालसर्प दोष बनता है। इसका प्रभाव ऐसा होता है कि परिश्रम फल में नहीं बदलता — अंतिम क्षण में नौकरी हाथ से निकल जाना, सौदे टूटना, बार-बार अस्वस्थता और नींद में अशांति। इसके निवारण हेतु त्र्यंबकेश्वर शास्त्रोक्त क्षेत्र है। हमारे पंडित जी नाग प्रतिमा पूजन, राहु-केतु शांति जाप एवं हवन सहित संपूर्ण विधि आपके नाम और गोत्र के संकल्प के साथ संपन्न करते हैं।",
    benefitsEn: ["Relief from repeated failures and delays", "Peace in sleep and freedom from disturbing dreams", "Stability in career and business decisions", "Reduction in family conflict and health issues", "Progress in marriage and childbirth matters"],
    benefitsHi: ["बार-बार असफलता व विलंब से राहत", "नींद में शांति, दुःस्वप्नों से मुक्ति", "करियर व व्यापार के निर्णयों में स्थिरता", "पारिवारिक कलह व स्वास्थ्य समस्याओं में कमी", "विवाह व संतान संबंधी बाधाओं में प्रगति"],
    ritualsEn: ["Ganesh puja & Kalash sthapana", "Naag-Naagin pratima pujan", "18,000 Rahu-Ketu mool mantra jaap", "Rudrabhishek with panchamrit", "Havan with 1,100 ahutis & purnahuti"],
    ritualsHi: ["गणेश पूजन एवं कलश स्थापना", "नाग-नागिन प्रतिमा पूजन", "18,000 राहु-केतु मूल मंत्र जाप", "पंचामृत सहित रुद्राभिषेक", "1,100 आहुतियों सहित हवन एवं पूर्णाहुति"],
    artKey: "trishul", days: 4, temple: "trayambakeshwar-nasik", category: "dosh-nivaran",
    featured: true, seats: 51, order: 1, packages: pkgSet(2100),
  },
  {
    slug: "mahamrityunjay-jaap-rudrabhishek",
    titleEn: "11,000 Mahamrityunjay Jaap & Rudrabhishek",
    titleHi: "11,000 महामृत्युंजय जाप एवं रुद्राभिषेक",
    subtitleEn: "For health, protection from illness and long life",
    subtitleHi: "आरोग्य, रोग से रक्षा एवं दीर्घायु हेतु",
    descriptionEn:
      "The Mahamrityunjay mantra is the shield Rishi Markandeya received from Mahadev himself. When someone in the family is unwell, when recovery is slow, or when there is fear about surgery and reports — this anushthan is performed. Eleven thousand jaap are completed by learned pandits followed by Rudrabhishek with panchamrit, bilva patra and Ganga jal.",
    descriptionHi:
      "महामृत्युंजय मंत्र वह कवच है जो ऋषि मार्कण्डेय को स्वयं महादेव से प्राप्त हुआ। जब परिवार में कोई अस्वस्थ हो, स्वास्थ्य लाभ धीमा हो, अथवा शल्य-चिकित्सा व रिपोर्ट को लेकर चिंता हो — तब यह अनुष्ठान किया जाता है। विद्वान पंडितों द्वारा ग्यारह हज़ार जाप के पश्चात पंचामृत, बिल्वपत्र एवं गंगाजल से रुद्राभिषेक संपन्न होता है।",
    benefitsEn: ["Support in recovery from prolonged illness", "Protection from accidents and untimely danger", "Mental peace and reduced anxiety", "Strength and longevity for elders in the family", "Shield against negative energy"],
    benefitsHi: ["दीर्घ रोग से स्वास्थ्य लाभ में सहायता", "दुर्घटना व अकाल संकट से रक्षा", "मानसिक शांति, चिंता में कमी", "परिवार के वृद्धजनों को बल व दीर्घायु", "नकारात्मक ऊर्जा से कवच"],
    ritualsEn: ["Sankalp with name & gotra", "Ganesh & Navgrah pujan", "11,000 Mahamrityunjay mantra jaap", "Rudrabhishek with panchamrit & bilva patra", "Shanti path & aarti"],
    ritualsHi: ["नाम व गोत्र सहित संकल्प", "गणेश एवं नवग्रह पूजन", "11,000 महामृत्युंजय मंत्र जाप", "पंचामृत व बिल्वपत्र से रुद्राभिषेक", "शांति पाठ एवं आरती"],
    artKey: "shivling", days: 2, temple: "rishikesh-neelkanth", category: "shiv-puja",
    featured: true, seats: 108, order: 2, packages: pkgSet(1851),
  },
  {
    slug: "pitru-dosh-shanti-pind-daan-gaya",
    titleEn: "Pitru Dosh Shanti & Pind Daan",
    titleHi: "पितृ दोष शांति एवं पिंडदान",
    subtitleEn: "Peace for ancestors, blessings for descendants",
    subtitleHi: "पितरों को शांति, वंश को आशीर्वाद",
    descriptionEn:
      "Pitru Dosh is felt when a family faces repeated obstacles in marriage, childbirth, property matters and career despite everything appearing correct. At Gaya, on the banks of the Falgu, Pind Daan and Tarpan are performed for the peace of departed ancestors. The vidhi is completed with your gotra, your ancestors' names and Tripindi shraddh.",
    descriptionHi:
      "पितृ दोष का अनुभव तब होता है जब सब कुछ ठीक होते हुए भी परिवार में विवाह, संतान, संपत्ति और करियर में बार-बार बाधा आती है। गया में फल्गु तट पर दिवंगत पितरों की शांति हेतु पिंडदान एवं तर्पण किया जाता है। यह विधि आपके गोत्र, पूर्वजों के नाम एवं त्रिपिंडी श्राद्ध सहित संपन्न होती है।",
    benefitsEn: ["Peace and gati for departed ancestors", "Removal of obstacles in marriage and progeny", "Relief in property and inheritance disputes", "Reduction of recurring misfortune in the family", "Ancestral blessings for the next generation"],
    benefitsHi: ["दिवंगत पितरों को शांति एवं गति", "विवाह व संतान की बाधाओं का निवारण", "संपत्ति व उत्तराधिकार विवाद में राहत", "परिवार में बार-बार आने वाले संकट में कमी", "आगामी पीढ़ी को पितृ आशीर्वाद"],
    ritualsEn: ["Falgu snan sankalp", "Pind Daan with your gotra", "Tila-Tarpan for three generations", "Tripindi shraddh vidhi", "Brahman bhoj & daan"],
    ritualsHi: ["फल्गु स्नान संकल्प", "आपके गोत्र से पिंडदान", "तीन पीढ़ियों हेतु तिल-तर्पण", "त्रिपिंडी श्राद्ध विधि", "ब्राह्मण भोज एवं दान"],
    artKey: "peepal", days: 6, temple: "vishnupad-gaya", category: "pitru-karya",
    featured: true, seats: 41, order: 3, packages: pkgSet(2551),
  },
  {
    slug: "shani-sade-sati-tel-abhishek",
    titleEn: "Shani Sade Sati Shanti & Tel Abhishek",
    titleHi: "शनि साढ़े साती शांति एवं तेल अभिषेक",
    subtitleEn: "Relief from the pressure of Shani's seven and a half years",
    subtitleHi: "साढ़े सात वर्ष की शनि दशा के दबाव से राहत",
    descriptionEn:
      "Sade Sati does not punish — it demands discipline. But when its pressure becomes heavy, work stalls, health weakens and mental burden increases. This anushthan includes 11,000 Shani mool mantra jaap, tel abhishek at the swayambhu Shani kshetra, and daan of black til, urad and iron in your name.",
    descriptionHi:
      "साढ़े साती दंड नहीं देती — अनुशासन माँगती है। किंतु जब इसका दबाव भारी हो जाता है तो कार्य रुकते हैं, स्वास्थ्य कमज़ोर होता है और मानसिक बोझ बढ़ता है। इस अनुष्ठान में 11,000 शनि मूल मंत्र जाप, स्वयंभू शनि क्षेत्र पर तेल अभिषेक एवं आपके नाम से काले तिल, उड़द व लोहे का दान सम्मिलित है।",
    benefitsEn: ["Reduced severity of Sade Sati and Dhaiya", "Stability in job, transfers and business", "Relief from chronic fatigue and joint pain", "Protection from legal and police matters", "Improved discipline and decision-making"],
    benefitsHi: ["साढ़े साती व ढैया की तीव्रता में कमी", "नौकरी, स्थानांतरण व व्यापार में स्थिरता", "लगातार थकान व जोड़ों के दर्द में राहत", "कानूनी व पुलिस प्रकरणों से रक्षा", "अनुशासन व निर्णय क्षमता में सुधार"],
    ritualsEn: ["Shani sankalp with name & gotra", "11,000 Shani mool mantra jaap", "Til tel abhishek on Shani vigraha", "Navgrah havan", "Daan of til, urad and loha"],
    ritualsHi: ["नाम व गोत्र सहित शनि संकल्प", "11,000 शनि मूल मंत्र जाप", "शनि विग्रह पर तिल-तेल अभिषेक", "नवग्रह हवन", "तिल, उड़द व लोहे का दान"],
    artKey: "chakra", days: 5, temple: "shani-shingnapur", category: "grah-shanti",
    featured: true, seats: 81, order: 4, packages: pkgSet(1551),
  },
  {
    slug: "mahalaxmi-dhan-prapti-anushthan",
    titleEn: "Mahalaxmi Dhan Prapti Mahaanushthan",
    titleHi: "महालक्ष्मी धन प्राप्ति महानुष्ठान",
    subtitleEn: "For flow of wealth and release of financial blockages",
    subtitleHi: "धन प्रवाह एवं आर्थिक अवरोध निवारण हेतु",
    descriptionEn:
      "Money that comes but never stays, payments stuck with clients, business that runs but never grows — these are signs of a blocked Laxmi sthan. At the Kolhapur Shakti Peeth, Shri Suktam path, Kanakdhara stotra and Laxmi mool mantra jaap are performed in your name, followed by havan and Kuber pujan.",
    descriptionHi:
      "धन आता है पर टिकता नहीं, ग्राहकों से भुगतान अटका रहता है, व्यापार चलता है पर बढ़ता नहीं — ये अवरुद्ध लक्ष्मी स्थान के लक्षण हैं। कोल्हापुर शक्तिपीठ पर आपके नाम से श्री सूक्तम् पाठ, कनकधारा स्तोत्र एवं लक्ष्मी मूल मंत्र जाप के पश्चात हवन एवं कुबेर पूजन संपन्न होता है।",
    benefitsEn: ["Improved cash flow and recovery of stuck payments", "Growth in business and new opportunities", "Reduction of unnecessary expenses", "Stability in savings and investments", "Prosperity and harmony at home"],
    benefitsHi: ["नकदी प्रवाह में सुधार, अटके भुगतान की वसूली", "व्यापार वृद्धि एवं नए अवसर", "अनावश्यक व्यय में कमी", "बचत व निवेश में स्थिरता", "घर में समृद्धि एवं सौहार्द"],
    ritualsEn: ["Kalash sthapana & Ganesh pujan", "Shri Suktam & Kanakdhara stotra path", "21,000 Mahalaxmi mool mantra jaap", "Kuber & Shri Yantra pujan", "Havan with kamal gatta & purnahuti"],
    ritualsHi: ["कलश स्थापना एवं गणेश पूजन", "श्री सूक्तम् एवं कनकधारा स्तोत्र पाठ", "21,000 महालक्ष्मी मूल मंत्र जाप", "कुबेर एवं श्री यंत्र पूजन", "कमलगट्टा सहित हवन एवं पूर्णाहुति"],
    artKey: "kalash", days: 8, temple: "mahalaxmi-kolhapur", category: "dhan-samriddhi",
    featured: true, seats: 51, order: 5, packages: pkgSet(2851),
  },
  {
    slug: "baglamukhi-shatru-badha-nivaran",
    titleEn: "Maa Baglamukhi Shatru Badha Nivaran Mahapuja",
    titleHi: "माँ बगलामुखी शत्रु बाधा निवारण महापूजा",
    subtitleEn: "Victory in disputes, court matters and protection from adversaries",
    subtitleHi: "विवाद, न्यायालयीन प्रकरण में विजय एवं शत्रु से रक्षा",
    descriptionEn:
      "Maa Baglamukhi is the stambhan shakti — she stills the intent of one who wishes you harm. This mahapuja is performed for those facing prolonged court cases, workplace conspiracies, false allegations or persistent enmity. Peeli sarson, haldi mala and mirchi havan are part of the shastra vidhi.",
    descriptionHi:
      "माँ बगलामुखी स्तंभन शक्ति हैं — वे अनिष्ट चाहने वाले की चेष्टा को स्तंभित कर देती हैं। यह महापूजा उन भक्तों के लिए है जो लंबे न्यायालयीन प्रकरण, कार्यस्थल के षड्यंत्र, झूठे आरोप अथवा निरंतर शत्रुता का सामना कर रहे हैं। पीली सरसों, हल्दी माला एवं मिर्ची हवन इस शास्त्र-विधि के अंग हैं।",
    benefitsEn: ["Favourable movement in pending court cases", "Protection from conspiracy at work", "Stambhan of enemy intent", "Relief from false allegations", "Confidence and clarity in speech"],
    benefitsHi: ["लंबित न्यायालयीन प्रकरण में अनुकूल गति", "कार्यस्थल के षड्यंत्र से रक्षा", "शत्रु की चेष्टा का स्तंभन", "झूठे आरोपों से राहत", "वाणी में आत्मविश्वास एवं स्पष्टता"],
    ritualsEn: ["Peetambara sankalp with name & gotra", "Baglamukhi kavach & stotra path", "31,000 mool mantra jaap by 3 pandits", "Haldi mala & peeli sarson arpan", "11 kg mirchi havan"],
    ritualsHi: ["नाम व गोत्र सहित पीतांबरा संकल्प", "बगलामुखी कवच एवं स्तोत्र पाठ", "3 पंडितों द्वारा 31,000 मूल मंत्र जाप", "हल्दी माला एवं पीली सरसों अर्पण", "11 किलो मिर्ची हवन"],
    artKey: "yantra", days: 10, temple: "peetambara-datia", category: "shakti-puja",
    seats: 31, order: 6, packages: pkgSet(3100),
  },
  {
    slug: "panchmukhi-hanuman-sarvkarya-siddhi",
    titleEn: "Panchmukhi Hanuman Sarvkarya Siddhi Puja",
    titleHi: "पंचमुखी हनुमान सर्वकार्य सिद्धि पूजा",
    subtitleEn: "Removes obstacles, restores courage and clarity",
    subtitleHi: "बाधा निवारण, साहस एवं स्पष्टता की पुनर्स्थापना",
    descriptionEn:
      "When fear settles in the mind, when work started with full effort keeps breaking, and when the home feels heavy with negativity — Hanuman ji's sharan is the shastra remedy. Sunderkand path, Hanuman Chalisa 108 times and chola arpan are performed at Mehandipur Balaji in your name.",
    descriptionHi:
      "जब मन में भय बैठ जाए, पूरे परिश्रम से आरंभ किया कार्य बार-बार टूटे, और घर में नकारात्मकता का बोझ अनुभव हो — तब हनुमान जी की शरण ही शास्त्रोक्त उपाय है। मेहंदीपुर बालाजी में आपके नाम से सुंदरकांड पाठ, 108 बार हनुमान चालीसा एवं चोला अर्पण किया जाता है।",
    benefitsEn: ["Freedom from fear and nazar dosh", "Courage to complete pending work", "Protection of home and family", "Relief from disturbed sleep", "Clarity in confused situations"],
    benefitsHi: ["भय एवं नज़र दोष से मुक्ति", "अधूरे कार्य पूर्ण करने का साहस", "घर एवं परिवार की रक्षा", "अशांत नींद से राहत", "उलझी परिस्थितियों में स्पष्टता"],
    ritualsEn: ["Sankalp with name & gotra", "Sunderkand path", "108 Hanuman Chalisa path", "Sindoor chola & chameli tel arpan", "Bhog & prasad vitran"],
    ritualsHi: ["नाम व गोत्र सहित संकल्प", "सुंदरकांड पाठ", "108 बार हनुमान चालीसा पाठ", "सिंदूर चोला एवं चमेली तेल अर्पण", "भोग एवं प्रसाद वितरण"],
    artKey: "gada", days: 3, temple: "mehandipur-balaji", category: "hanuman-puja",
    seats: 151, order: 7, packages: pkgSet(1100),
  },
  {
    slug: "santan-prapti-putrada-anushthan",
    titleEn: "Santan Prapti Anushthan",
    titleHi: "संतान प्राप्ति अनुष्ठान",
    subtitleEn: "For the blessing of a healthy child",
    subtitleHi: "स्वस्थ संतान के आशीर्वाद हेतु",
    descriptionEn:
      "For couples waiting for the joy of a child, this anushthan is performed at Ayodhya Dham with Santan Gopal mantra jaap, Harivansh Puran path and Putrada Ekadashi vrat sankalp — taking both partners' names and gotra.",
    descriptionHi:
      "जो दंपति संतान सुख की प्रतीक्षा में हैं, उनके लिए अयोध्या धाम में संतान गोपाल मंत्र जाप, हरिवंश पुराण पाठ एवं पुत्रदा एकादशी व्रत संकल्प सहित यह अनुष्ठान — दोनों के नाम व गोत्र लेकर — संपन्न किया जाता है।",
    benefitsEn: ["Blessings for conception and healthy pregnancy", "Peace of mind for both partners", "Removal of doshas obstructing progeny", "Strength and wellbeing of the child", "Harmony in married life"],
    benefitsHi: ["गर्भधारण एवं स्वस्थ गर्भावस्था हेतु आशीर्वाद", "दोनों के मन को शांति", "संतान बाधक दोषों का निवारण", "संतान को बल एवं आरोग्य", "दांपत्य जीवन में सामंजस्य"],
    ritualsEn: ["Sankalp with both names & gotra", "21,000 Santan Gopal mantra jaap", "Harivansh Puran path", "Palna pujan & bhog arpan", "Havan with purnahuti"],
    ritualsHi: ["दोनों के नाम व गोत्र सहित संकल्प", "21,000 संतान गोपाल मंत्र जाप", "हरिवंश पुराण पाठ", "पालना पूजन एवं भोग अर्पण", "हवन एवं पूर्णाहुति"],
    artKey: "lotus", days: 12, temple: "ayodhya-dham", category: "santan-vivah",
    seats: 41, order: 8, packages: pkgSet(2251),
  },
  {
    slug: "navgrah-shanti-mahapuja-ujjain",
    titleEn: "Navgrah Shanti Mahapuja & 108 Havan",
    titleHi: "नवग्रह शांति महापूजा एवं 108 हवन",
    subtitleEn: "Balance all nine planets in your kundali",
    subtitleHi: "कुंडली के नवों ग्रहों का संतुलन",
    descriptionEn:
      "When more than one planet is afflicted, treating them one by one does not help. Navgrah Shanti balances all nine together — each graha gets its own samidha, mantra count and daan, performed at Ujjain, the kaal-chakra centre of Bharat.",
    descriptionHi:
      "जब एक से अधिक ग्रह पीड़ित हों, तब उन्हें अलग-अलग साधने से लाभ नहीं होता। नवग्रह शांति नवों ग्रहों को एक साथ संतुलित करती है — प्रत्येक ग्रह की अपनी समिधा, मंत्र संख्या एवं दान, जो भारत के काल-चक्र केंद्र उज्जैन में संपन्न होता है।",
    benefitsEn: ["Balance of all nine planetary energies", "Relief from repeated grah dasha trouble", "Stability in health, wealth and relationships", "Better results from your own effort", "Overall shanti in the home"],
    benefitsHi: ["नवों ग्रह ऊर्जाओं का संतुलन", "बार-बार आने वाली ग्रह दशा की पीड़ा से राहत", "स्वास्थ्य, धन व संबंधों में स्थिरता", "अपने परिश्रम का बेहतर फल", "घर में समग्र शांति"],
    ritualsEn: ["Navgrah mandal sthapana", "Individual mantra jaap for all 9 grahas", "108 ahuti havan per graha", "Navratna & anna daan", "Shanti path & aarti"],
    ritualsHi: ["नवग्रह मंडल स्थापना", "नवों ग्रहों हेतु पृथक मंत्र जाप", "प्रति ग्रह 108 आहुति हवन", "नवरत्न एवं अन्न दान", "शांति पाठ एवं आरती"],
    artKey: "sun", days: 7, temple: "mahakaleshwar-ujjain", category: "grah-shanti",
    seats: 61, order: 9, packages: pkgSet(2451),
  },
  {
    slug: "rin-mukti-kashi-vishwanath",
    titleEn: "Rin Mukti Puja & Shiv Rudrabhishek",
    titleHi: "ऋण मुक्ति पूजा एवं शिव रुद्राभिषेक",
    subtitleEn: "Freedom from debt burden and financial pressure",
    subtitleHi: "ऋण के बोझ एवं आर्थिक दबाव से मुक्ति",
    descriptionEn:
      "Loans that keep growing, EMIs that never end, money borrowed to repay money — this cycle is as much a graha condition as it is a financial one. At Kashi, Rin Mukteshwar vidhi with Rudrabhishek and Rin Harta stotra path is performed in your name.",
    descriptionHi:
      "बढ़ता हुआ ऋण, कभी न समाप्त होने वाली किश्तें, उधार चुकाने के लिए फिर उधार — यह चक्र जितना आर्थिक है उतना ही ग्रह-जनित भी। काशी में आपके नाम से ऋण मुक्तेश्वर विधि, रुद्राभिषेक एवं ऋणहर्ता स्तोत्र पाठ संपन्न होता है।",
    benefitsEn: ["Path to clearing long-standing debt", "Relief from financial anxiety", "Recovery of money lent to others", "Reduced unnecessary borrowing", "Steady improvement in income"],
    benefitsHi: ["पुराने ऋण के निपटान का मार्ग", "आर्थिक चिंता से राहत", "दूसरों को दिए धन की वापसी", "अनावश्यक उधारी में कमी", "आय में क्रमिक सुधार"],
    ritualsEn: ["Ganga jal sankalp", "Rin Mukteshwar Mahadev pujan", "Rin Harta Ganesh stotra path", "Rudrabhishek with 11 dravya", "Havan & anna daan"],
    ritualsHi: ["गंगाजल संकल्प", "ऋण मुक्तेश्वर महादेव पूजन", "ऋणहर्ता गणेश स्तोत्र पाठ", "11 द्रव्यों से रुद्राभिषेक", "हवन एवं अन्न दान"],
    artKey: "om", days: 9, temple: "kashi-vishwanath", category: "dhan-samriddhi",
    seats: 71, order: 10, packages: pkgSet(1951),
  },
  {
    slug: "mangal-dosh-vivah-badha-nivaran",
    titleEn: "Mangal Dosh & Vivah Badha Nivaran",
    titleHi: "मंगल दोष एवं विवाह बाधा निवारण",
    subtitleEn: "Clear the obstacles delaying marriage",
    subtitleHi: "विवाह में विलंब की बाधाओं का निवारण",
    descriptionEn:
      "Proposals that reach the final stage and break, an alliance that everyone approves but never concludes — Mangal dosh and an afflicted seventh house are often behind it. This anushthan includes Mangal shanti jaap, Kumbh vivah sankalp where prescribed, and Gauri-Shankar pujan.",
    descriptionHi:
      "जो रिश्ते अंतिम चरण तक पहुँचकर टूट जाएँ, जिस संबंध को सब स्वीकार करें पर वह संपन्न न हो — इसके पीछे प्रायः मंगल दोष एवं पीड़ित सप्तम भाव होता है। इस अनुष्ठान में मंगल शांति जाप, आवश्यकता होने पर कुंभ विवाह संकल्प एवं गौरी-शंकर पूजन सम्मिलित है।",
    benefitsEn: ["Removal of delay in marriage proposals", "Reduction of Mangal dosh severity", "Harmony between prospective families", "Peace in existing married life", "Blessings of Gauri-Shankar for the couple"],
    benefitsHi: ["विवाह प्रस्तावों में विलंब का निवारण", "मंगल दोष की तीव्रता में कमी", "दोनों परिवारों में सामंजस्य", "वर्तमान दांपत्य जीवन में शांति", "दंपति हेतु गौरी-शंकर का आशीर्वाद"],
    ritualsEn: ["Sankalp with name, gotra & birth details", "10,000 Mangal mool mantra jaap", "Gauri-Shankar pujan", "Kumbh vivah vidhi (if prescribed)", "Havan with red masoor daan"],
    ritualsHi: ["नाम, गोत्र व जन्म विवरण सहित संकल्प", "10,000 मंगल मूल मंत्र जाप", "गौरी-शंकर पूजन", "आवश्यकता होने पर कुंभ विवाह विधि", "हवन एवं लाल मसूर दान"],
    artKey: "swastik", days: 11, temple: "mahakaleshwar-ujjain", category: "santan-vivah",
    seats: 51, order: 11, packages: pkgSet(1751),
  },
  {
    slug: "bhasma-aarti-mahakal-rudrabhishek",
    titleEn: "Mahakal Bhasma Aarti Sankalp & Rudrabhishek",
    titleHi: "महाकाल भस्म आरती संकल्प एवं रुद्राभिषेक",
    subtitleEn: "Participate in the sacred pre-dawn aarti of Mahakaleshwar",
    subtitleHi: "महाकालेश्वर की पवित्र ब्रह्म-मुहूर्त आरती में सहभागिता",
    descriptionEn:
      "The Bhasma Aarti of Mahakal is performed in the brahma muhurt before dawn — the only aarti of its kind in the world. Your name and gotra are included in the sankalp, and Rudrabhishek is performed on your behalf. The recorded aarti reaches you the same day.",
    descriptionHi:
      "महाकाल की भस्म आरती ब्रह्म मुहूर्त में, सूर्योदय से पूर्व संपन्न होती है — विश्व में अपने प्रकार की एकमात्र आरती। संकल्प में आपका नाम व गोत्र सम्मिलित होता है और आपकी ओर से रुद्राभिषेक किया जाता है। आरती की रिकॉर्डिंग उसी दिन आपको प्राप्त होती है।",
    benefitsEn: ["Darshan punya of the Bhasma Aarti", "Mahadev's blessing for fearlessness", "Release from long-standing mental burden", "Auspicious start for a new venture", "Protection of the whole family"],
    benefitsHi: ["भस्म आरती का दर्शन पुण्य", "निर्भयता हेतु महादेव का आशीर्वाद", "दीर्घकालीन मानसिक बोझ से मुक्ति", "नए कार्य का शुभारंभ", "संपूर्ण परिवार की रक्षा"],
    ritualsEn: ["Brahma muhurt sankalp with name & gotra", "Bhasma Aarti participation", "Rudrabhishek with panchamrit", "Bilva patra & bhang arpan", "Bhasma prasad dispatch"],
    ritualsHi: ["ब्रह्म मुहूर्त में नाम व गोत्र सहित संकल्प", "भस्म आरती में सहभागिता", "पंचामृत सहित रुद्राभिषेक", "बिल्वपत्र एवं भांग अर्पण", "भस्म प्रसाद प्रेषण"],
    artKey: "bell", days: 1, temple: "mahakaleshwar-ujjain", category: "shiv-puja",
    featured: true, seats: 21, order: 12, packages: pkgSet(2951),
  },
];

/* ------------------------------------------------------------------ */
/*  Offerings, Products, Testimonials, FAQs                            */
/* ------------------------------------------------------------------ */

const OFFERINGS = [
  { slug: "chunri-mata-rani", titleEn: "Chunri & Shringar at Shakti Peeth", titleHi: "शक्तिपीठ में चुनरी एवं श्रृंगार", descEn: "Red chunri, bangles, sindoor and shringar samagri offered to Maa in your name.", descHi: "आपके नाम से माँ को लाल चुनरी, चूड़ी, सिंदूर एवं श्रृंगार सामग्री अर्पित।", templeNameEn: "Peetambara Shaktipeeth, Datia", templeNameHi: "पीतांबरा शक्तिपीठ, दतिया", priceInPaise: 51100, artKey: "lotus", order: 1 },
  { slug: "bilva-patra-rudrabhishek", titleEn: "1,100 Bilva Patra Arpan", titleHi: "1,100 बिल्वपत्र अर्पण", descEn: "Eleven hundred bilva patra offered on the Shivling with your sankalp.", descHi: "आपके संकल्प के साथ शिवलिंग पर ग्यारह सौ बिल्वपत्र अर्पित।", templeNameEn: "Kashi Vishwanath Dham", templeNameHi: "काशी विश्वनाथ धाम", priceInPaise: 41100, artKey: "shivling", order: 2 },
  { slug: "sindoor-chola-hanuman", titleEn: "Sindoor Chola to Hanuman Ji", titleHi: "हनुमान जी को सिंदूर चोला", descEn: "Chameli oil and sindoor chola offered on Tuesday in your name.", descHi: "मंगलवार को आपके नाम से चमेली तेल एवं सिंदूर चोला अर्पण।", templeNameEn: "Mehandipur Balaji Dham", templeNameHi: "मेहंदीपुर बालाजी धाम", priceInPaise: 31100, artKey: "gada", order: 3 },
  { slug: "til-tel-shani-abhishek", titleEn: "Til Tel Abhishek to Shani Dev", titleHi: "शनि देव को तिल-तेल अभिषेक", descEn: "Black til oil abhishek performed on Saturday with your name and gotra.", descHi: "शनिवार को आपके नाम व गोत्र से काले तिल के तेल का अभिषेक।", templeNameEn: "Shani Shingnapur", templeNameHi: "शनि शिंगणापुर", priceInPaise: 25100, artKey: "chakra", order: 4 },
  { slug: "annadaan-seva", titleEn: "Annadaan Seva (51 people)", titleHi: "अन्नदान सेवा (51 व्यक्ति)", descEn: "Bhojan prasad served to 51 devotees and brahmans in your family's name.", descHi: "आपके परिवार के नाम से 51 भक्तों व ब्राह्मणों को भोजन प्रसाद।", templeNameEn: "Vishnupad Temple, Gaya", templeNameHi: "विष्णुपद मंदिर, गया", priceInPaise: 111100, artKey: "kalash", order: 5 },
  { slug: "deepdaan-ganga-aarti", titleEn: "Deepdaan at Ganga Aarti", titleHi: "गंगा आरती में दीपदान", descEn: "101 diyas floated on the Ganga during the evening aarti with your sankalp.", descHi: "संध्या आरती में आपके संकल्प के साथ गंगा में 101 दीपों का प्रवाह।", templeNameEn: "Dashashwamedh Ghat, Kashi", templeNameHi: "दशाश्वमेध घाट, काशी", priceInPaise: 21100, artKey: "diya", order: 6 },
];

const PRODUCTS = [
  { slug: "5-mukhi-rudraksh-mala", nameEn: "5-Mukhi Rudraksh Mala (108 beads)", nameHi: "5 मुखी रुद्राक्ष माला (108 दाने)", descEn: "Original Nepali 5-mukhi rudraksh, energised with Mahamrityunjay jaap at Kashi.", descHi: "मूल नेपाली 5 मुखी रुद्राक्ष, काशी में महामृत्युंजय जाप से अभिमंत्रित।", priceInPaise: 185100, mrpInPaise: 249900, artKey: "rudraksh", groupEn: "Mala & Jaap", groupHi: "माला एवं जाप", order: 1 },
  { slug: "shri-yantra-copper", nameEn: "Copper Shri Yantra (3 inch)", nameHi: "ताम्र श्री यंत्र (3 इंच)", descEn: "Pure copper Shri Yantra, pran-pratishtha done at Mahalaxmi Temple, Kolhapur.", descHi: "शुद्ध ताम्र श्री यंत्र, महालक्ष्मी मंदिर कोल्हापुर में प्राण-प्रतिष्ठित।", priceInPaise: 141100, mrpInPaise: 199900, artKey: "yantra", groupEn: "Yantra", groupHi: "यंत्र", order: 2 },
  { slug: "parad-shivling", nameEn: "Parad Shivling (50 gm)", nameHi: "पारद शिवलिंग (50 ग्राम)", descEn: "Solidified mercury Shivling for the home mandir, abhishek-ready.", descHi: "घर के मंदिर हेतु पारद शिवलिंग, अभिषेक के लिए तैयार।", priceInPaise: 275100, mrpInPaise: 349900, artKey: "shivling", groupEn: "Vigraha", groupHi: "विग्रह", order: 3 },
  { slug: "havan-samagri-kit", nameEn: "Complete Havan Samagri Kit", nameHi: "संपूर्ण हवन सामग्री किट", descEn: "Everything needed for a home havan — samidha, ghee, dhoop, kalash and vidhi booklet.", descHi: "घर पर हवन हेतु सब कुछ — समिधा, घी, धूप, कलश एवं विधि पुस्तिका।", priceInPaise: 89100, mrpInPaise: 129900, artKey: "kalash", groupEn: "Puja Samagri", groupHi: "पूजा सामग्री", order: 4 },
  { slug: "kaal-sarp-yantra", nameEn: "Kaal Sarp Dosh Nivaran Yantra", nameHi: "कालसर्प दोष निवारण यंत्र", descEn: "Ashtadhatu yantra energised at Trayambakeshwar with 18,000 jaap.", descHi: "त्र्यंबकेश्वर में 18,000 जाप से अभिमंत्रित अष्टधातु यंत्र।", priceInPaise: 155100, mrpInPaise: 219900, artKey: "trishul", groupEn: "Yantra", groupHi: "यंत्र", order: 5 },
  { slug: "brass-panchmukhi-diya", nameEn: "Brass Panchmukhi Diya", nameHi: "पीतल पंचमुखी दीया", descEn: "Traditional five-wick brass diya for daily aarti at your home mandir.", descHi: "घर के मंदिर में नित्य आरती हेतु पारंपरिक पाँच-बत्ती पीतल दीया।", priceInPaise: 69100, mrpInPaise: 99900, artKey: "diya", groupEn: "Puja Samagri", groupHi: "पूजा सामग्री", order: 6 },
  { slug: "sphatik-mala", nameEn: "Sphatik (Crystal) Mala", nameHi: "स्फटिक माला", descEn: "Natural sphatik mala for Laxmi and Chandra mantra jaap.", descHi: "लक्ष्मी एवं चंद्र मंत्र जाप हेतु प्राकृतिक स्फटिक माला।", priceInPaise: 95100, mrpInPaise: 139900, artKey: "rudraksh", groupEn: "Mala & Jaap", groupHi: "माला एवं जाप", order: 7 },
  { slug: "gomti-chakra-set", nameEn: "Gomti Chakra Set (11 pcs)", nameHi: "गोमती चक्र सेट (11 नग)", descEn: "Eleven natural Gomti chakras, used in Laxmi sadhana and vastu upay.", descHi: "ग्यारह प्राकृतिक गोमती चक्र, लक्ष्मी साधना एवं वास्तु उपाय हेतु।", priceInPaise: 45100, mrpInPaise: 69900, artKey: "shankh", groupEn: "Vastu & Upay", groupHi: "वास्तु एवं उपाय", order: 8 },
];

const TESTIMONIALS = [
  { name: "Ramesh Agarwal", city: "Indore", rating: 5, textEn: "I had been running behind a court matter for four years. After the Baglamukhi puja at Datia, the next hearing went in our favour. The pandit ji took my name and gotra clearly in the sankalp — I saw it in the video myself.", textHi: "चार वर्षों से एक न्यायालयीन प्रकरण में भाग-दौड़ चल रही थी। दतिया में बगलामुखी पूजा के बाद अगली सुनवाई हमारे पक्ष में गई। पंडित जी ने संकल्प में मेरा नाम और गोत्र स्पष्ट लिया — वीडियो में मैंने स्वयं देखा।", order: 1 },
  { name: "Sunita Deshmukh", city: "Pune", rating: 5, textEn: "My mother-in-law is 78 and was in hospital. We booked the Mahamrityunjay jaap the same night. The video came within a day and prasad reached in a week. It gave the whole family courage.", textHi: "मेरी सास 78 वर्ष की हैं और अस्पताल में थीं। हमने उसी रात महामृत्युंजय जाप बुक किया। वीडियो एक दिन में आ गया और प्रसाद एक सप्ताह में पहुँचा। पूरे परिवार को साहस मिला।", order: 2 },
  { name: "Vikram Singh", city: "Jaipur", rating: 5, textEn: "I live in Dubai and cannot travel for every occasion. Doing the Pitru Paksha pind daan at Gaya through Pooja Path felt like I was standing there myself. Every step was on WhatsApp.", textHi: "मैं दुबई में रहता हूँ, हर अवसर पर आना संभव नहीं। पूजा पथ के माध्यम से गया में पितृ पक्ष पिंडदान करवाकर लगा जैसे मैं स्वयं वहाँ खड़ा था। हर चरण की सूचना व्हाट्सएप पर मिली।", order: 3 },
  { name: "Anita Verma", city: "Lucknow", rating: 5, textEn: "Booking took two minutes — no account, no password. Just name, gotra and number. My father, who is 70, also booked one himself without any help.", textHi: "बुकिंग में दो मिनट लगे — न अकाउंट, न पासवर्ड। बस नाम, गोत्र और नंबर। मेरे 70 वर्षीय पिताजी ने भी बिना किसी सहायता के स्वयं बुकिंग कर ली।", order: 4 },
  { name: "Mahesh Patel", city: "Ahmedabad", rating: 5, textEn: "The Shani tel abhishek at Shingnapur was done exactly on the Saturday they promised. Work pressure has eased since. The prasad packet was properly sealed and clean.", textHi: "शिंगणापुर में शनि तेल अभिषेक ठीक उसी शनिवार को हुआ जिसका वादा था। तब से कार्य का दबाव कम हुआ है। प्रसाद पैकेट भली प्रकार सील और स्वच्छ था।", order: 5 },
  { name: "Kavita Nair", city: "Bengaluru", rating: 5, textEn: "We had almost given up on a child. We did the Santan Prapti anushthan at Ayodhya last year. Today our daughter is four months old. I have no words, only gratitude.", textHi: "हमने संतान की आशा लगभग छोड़ दी थी। पिछले वर्ष अयोध्या में संतान प्राप्ति अनुष्ठान करवाया। आज हमारी बेटी चार महीने की है। शब्द नहीं हैं, केवल कृतज्ञता है।", order: 6 },
];

const FAQS = [
  { questionEn: "Do I need to create an account to book a puja?", questionHi: "पूजा बुक करने के लिए क्या अकाउंट बनाना पड़ेगा?", answerEn: "No. There is no login or password anywhere on Pooja Path. You only fill your name, gotra and WhatsApp number in the booking form. All updates — confirmation, puja video and prasad tracking — come to that same number.", answerHi: "नहीं। पूजा पथ पर कहीं भी लॉगिन या पासवर्ड नहीं है। आपको बुकिंग फॉर्म में केवल अपना नाम, गोत्र और व्हाट्सएप नंबर भरना है। सभी अपडेट — कन्फर्मेशन, पूजा वीडियो और प्रसाद ट्रैकिंग — उसी नंबर पर आएँगे।", order: 1 },
  { questionEn: "I don't know my gotra. What should I write?", questionHi: "मुझे अपना गोत्र नहीं पता। क्या लिखूँ?", answerEn: "This is very common and it is not a problem. Shastra permits writing 'Kashyap' gotra when the family gotra is unknown — it is accepted for every sankalp. You may also ask an elder in the family, or write to us on WhatsApp and our pandit ji will guide you.", answerHi: "यह बहुत सामान्य है और कोई समस्या नहीं। जब कुल का गोत्र ज्ञात न हो तो शास्त्र 'कश्यप' गोत्र लिखने की अनुमति देता है — यह हर संकल्प में स्वीकार्य है। आप परिवार के किसी बुज़ुर्ग से भी पूछ सकते हैं, या हमें व्हाट्सएप करें, पंडित जी मार्गदर्शन करेंगे।", order: 2 },
  { questionEn: "How do I know the puja was actually performed in my name?", questionHi: "मुझे कैसे पता चलेगा कि पूजा वास्तव में मेरे नाम से हुई?", answerEn: "You receive the complete puja video, not an edited clip. In it you can clearly hear the pandit ji speaking your name and gotra during the sankalp. Along with it you get a puja completion certificate mentioning the temple, date and pandit's name.", answerHi: "आपको पूरी पूजा का वीडियो मिलता है, कोई संपादित क्लिप नहीं। उसमें आप स्पष्ट सुन सकते हैं कि पंडित जी संकल्प में आपका नाम और गोत्र ले रहे हैं। साथ में मंदिर, तिथि और पंडित जी के नाम सहित पूजा संपन्नता प्रमाण-पत्र भी मिलता है।", order: 3 },
  { questionEn: "When will I get the video and the prasad?", questionHi: "वीडियो और प्रसाद कब मिलेगा?", answerEn: "The puja video is sent on your WhatsApp within 24 to 48 hours of the puja. Temple prasad is couriered to the address you provide and usually reaches within 7 to 10 working days. A tracking number is shared as soon as it is dispatched.", answerHi: "पूजा का वीडियो पूजा के 24 से 48 घंटे के भीतर आपके व्हाट्सएप पर भेजा जाता है। मंदिर का प्रसाद आपके दिए पते पर कूरियर होता है और सामान्यतः 7 से 10 कार्य दिवसों में पहुँच जाता है। प्रेषण होते ही ट्रैकिंग नंबर साझा किया जाता है।", order: 4 },
  { questionEn: "Can I book one puja for my whole family?", questionHi: "क्या मैं पूरे परिवार के लिए एक ही पूजा बुक कर सकता हूँ?", answerEn: "Yes. Choose the Family or Sampoorna package and add each member's name in the booking form. The pandit ji will take all the names together in one sankalp with your gotra.", answerHi: "हाँ। परिवार अथवा संपूर्ण पैकेज चुनें और बुकिंग फॉर्म में प्रत्येक सदस्य का नाम जोड़ें। पंडित जी सभी नाम आपके गोत्र के साथ एक ही संकल्प में लेंगे।", order: 5 },
  { questionEn: "Is my payment and personal information safe?", questionHi: "क्या मेरा भुगतान और व्यक्तिगत जानकारी सुरक्षित है?", answerEn: "Payments are handled entirely by Razorpay, an RBI-authorised payment gateway. We never see or store your card, UPI or bank details. Your name, gotra and number are used only for the puja sankalp and for sending you updates — they are never sold or shared.", answerHi: "भुगतान पूर्णतः रेज़रपे द्वारा संचालित होता है, जो RBI-अधिकृत पेमेंट गेटवे है। आपके कार्ड, UPI अथवा बैंक विवरण हम न देखते हैं न संग्रहित करते हैं। आपका नाम, गोत्र और नंबर केवल पूजा संकल्प एवं अपडेट भेजने हेतु प्रयोग होते हैं — इन्हें कभी बेचा या साझा नहीं किया जाता।", order: 6 },
  { questionEn: "Can I cancel a booking?", questionHi: "क्या मैं बुकिंग रद्द कर सकता हूँ?", answerEn: "Yes, a booking can be cancelled with a full refund up to 24 hours before the puja date. Within 24 hours the samagri is already purchased and the pandit allocated, so cancellation is not possible. Full details are in our Refund & Cancellation policy.", answerHi: "हाँ, पूजा तिथि से 24 घंटे पूर्व तक बुकिंग रद्द कर पूर्ण राशि वापस पाई जा सकती है। 24 घंटे के भीतर सामग्री क्रय हो चुकी होती है और पंडित जी नियुक्त हो चुके होते हैं, अतः रद्दीकरण संभव नहीं। पूर्ण विवरण हमारी रिफंड एवं रद्दीकरण नीति में है।", order: 7 },
  { questionEn: "I live outside India. Can I still book?", questionHi: "मैं भारत के बाहर रहता हूँ। क्या फिर भी बुक कर सकता हूँ?", answerEn: "Yes, devotees from anywhere in the world can book. The puja video reaches you on WhatsApp regardless of country. For prasad delivery outside India please message us on WhatsApp first so we can confirm courier availability and charges.", answerHi: "हाँ, विश्व के किसी भी कोने से भक्त बुकिंग कर सकते हैं। पूजा का वीडियो देश की परवाह किए बिना व्हाट्सएप पर पहुँचता है। भारत के बाहर प्रसाद डिलीवरी हेतु कृपया पहले व्हाट्सएप पर संदेश करें ताकि हम कूरियर की उपलब्धता एवं शुल्क की पुष्टि कर सकें।", order: 8 },
];

/* ------------------------------------------------------------------ */
/*  Runner                                                             */
/* ------------------------------------------------------------------ */

async function main() {
  console.log("🪔 Pooja Path demo content seed shuru...\n");

  /* --- admin --- */
  // (admin hamesha check hota hai — content sirf pehli baar daalte hain)
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@poojapath.in").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const [existingAdmin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    await db.insert(adminUsers).values({
      email: adminEmail,
      name: "Site Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "owner",
    });
    console.log(`👤 Admin banaya: ${adminEmail}`);
    console.log("   ⚠️  Login karte hi password badal dena.");
  } else {
    console.log(`👤 Admin pehle se hai: ${adminEmail}`);
  }

  /* --- content sirf pehli baar --- */
  // Har deploy par seed chalta hai, isliye agar pujas pehle se hain to
  // demo content dobara nahi likhte — warna admin ke kiye badlaav mit jayenge.
  // Zabardasti dobara daalna ho to:  SEED_FORCE=1 npm run db:seed
  const existingPujas = await db.select({ id: pujas.id }).from(pujas).limit(1);
  if (existingPujas.length > 0 && process.env.SEED_FORCE !== "1") {
    console.log(
      "\n📦 Content pehle se maujood hai — demo data skip kiya gaya.\n" +
        "   (Zabardasti daalna ho to: SEED_FORCE=1 npm run db:seed)\n",
    );
    return;
  }

  /* --- categories --- */
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const [row] = await db
      .insert(categories)
      .values(c)
      .onConflictDoUpdate({
        target: categories.slug,
        set: { nameEn: c.nameEn, nameHi: c.nameHi, icon: c.icon, order: c.order },
      })
      .returning({ id: categories.id });
    categoryIds.set(c.slug, row.id);
  }
  console.log(`📂 ${CATEGORIES.length} categories`);

  /* --- temples --- */
  const templeIds = new Map<string, string>();
  for (const tm of TEMPLES) {
    const [row] = await db
      .insert(temples)
      .values(tm)
      .onConflictDoUpdate({ target: temples.slug, set: { ...tm } })
      .returning({ id: temples.id });
    templeIds.set(tm.slug, row.id);
  }
  console.log(`🛕 ${TEMPLES.length} temples`);

  /* --- pujas + packages --- */
  for (const p of PUJAS) {
    const values = {
      slug: p.slug,
      titleEn: p.titleEn, titleHi: p.titleHi,
      subtitleEn: p.subtitleEn, subtitleHi: p.subtitleHi,
      descriptionEn: p.descriptionEn, descriptionHi: p.descriptionHi,
      benefitsEn: p.benefitsEn, benefitsHi: p.benefitsHi,
      ritualsEn: p.ritualsEn, ritualsHi: p.ritualsHi,
      artKey: p.artKey,
      pujaDate: at(p.days),
      isFeatured: p.featured ?? false,
      isActive: true,
      seatsTotal: p.seats ?? null,
      order: p.order,
      categoryId: categoryIds.get(p.category) ?? null,
      templeId: templeIds.get(p.temple) ?? null,
      updatedAt: new Date(),
    };

    const [row] = await db
      .insert(pujas)
      .values(values)
      .onConflictDoUpdate({ target: pujas.slug, set: values })
      .returning({ id: pujas.id });

    // packages dobara likhte hain taaki demo hamesha consistent rahe
    await db.delete(packages).where(eq(packages.pujaId, row.id));
    await db.insert(packages).values(
      p.packages.map((pk, i) => ({
        pujaId: row.id,
        nameEn: pk.nameEn, nameHi: pk.nameHi,
        priceInPaise: pk.price * 100,
        mrpInPaise: pk.mrp ? pk.mrp * 100 : null,
        maxMembers: pk.maxMembers,
        featuresEn: pk.featuresEn, featuresHi: pk.featuresHi,
        isPopular: pk.isPopular ?? false,
        order: i,
      })),
    );
  }
  console.log(`🕉️  ${PUJAS.length} pujas (packages ke saath)`);

  /* --- offerings --- */
  for (const o of OFFERINGS) {
    await db
      .insert(offerings)
      .values(o)
      .onConflictDoUpdate({ target: offerings.slug, set: { ...o } });
  }
  console.log(`🌺 ${OFFERINGS.length} chadhava offerings`);

  /* --- products --- */
  for (const pr of PRODUCTS) {
    await db
      .insert(products)
      .values(pr)
      .onConflictDoUpdate({ target: products.slug, set: { ...pr } });
  }
  console.log(`📿 ${PRODUCTS.length} store products`);

  /* --- testimonials & faqs (replace) --- */
  const existingT = await db.select({ id: testimonials.id }).from(testimonials).limit(1);
  if (existingT.length === 0) {
    await db.insert(testimonials).values(TESTIMONIALS);
    console.log(`💬 ${TESTIMONIALS.length} testimonials`);
  } else {
    console.log("💬 testimonials pehle se hain — chhod diye");
  }

  const existingF = await db.select({ id: faqs.id }).from(faqs).limit(1);
  if (existingF.length === 0) {
    await db.insert(faqs).values(FAQS);
    console.log(`❓ ${FAQS.length} FAQs`);
  } else {
    console.log("❓ FAQs pehle se hain — chhod diye");
  }

  console.log("\n✨ Seed poora hua. `npm run dev` chalayein.\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed fail hua:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
