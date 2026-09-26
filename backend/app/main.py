import os
import sqlite3
from contextlib import asynccontextmanager, closing
from datetime import date
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, model_validator

DB_PATH = os.getenv("DB_PATH", "floow2.db")

Deal = Literal["rent", "sale", "service", "request"]
Unit = Literal["hour", "day", "month", "project", "item"]
Category = Literal["construction", "industrial", "warehouse", "transport", "mining", "maintenance", "personnel", "lab"]
City = Literal["tehran", "alborz", "isfahan", "mashhad", "ahvaz", "shiraz"]

# (deal, category, title_fa, title_en, desc_fa, desc_en, price, unit, city, company_fa, company_en, rating, verified, insured, featured)
SEED = [
    ("rent", "construction", "بیل مکانیکی کوماتسو PC220", "Komatsu PC220 excavator", "مدل ۲۰۲۱، سرویس‌شده، همراه با اپراتور مجرب. تحویل در محل پروژه در تهران و حومه.", "2021 model, fully serviced, operator included. On-site delivery across Tehran.", 28_000_000, "day", "tehran", "عمران پارس سازه", "Omran Pars Sazeh", 4.9, 1, 1, 1),
    ("rent", "construction", "جرثقیل برجی ۸ تن", "8-ton tower crane", "ارتفاع زیر قلاب ۴۰ متر، نصب و بازرسی فنی توسط تیم ما.", "40 m hook height, installation and safety inspection by our team.", 95_000_000, "month", "alborz", "سازه‌گستر البرز", "Sazeh Gostar Alborz", 4.7, 1, 1, 0),
    ("rent", "warehouse", "لیفتراک برقی تویوتا ۲.۵ تن", "Toyota 2.5 t electric forklift", "باتری لیتیومی، مناسب انبار سرپوشیده، شارژر همراه دستگاه.", "Lithium battery, indoor-ready, charger included.", 4_500_000, "day", "tehran", "لجستیک نوین آریا", "Novin Arya Logistics", 4.8, 1, 1, 1),
    ("rent", "warehouse", "انبار ۱٬۲۰۰ متری با قفسه‌بندی", "1,200 m² racked warehouse", "ارتفاع ۹ متر، رمپ بارگیری، نگهبانی ۲۴ ساعته و دوربین مداربسته.", "9 m clear height, loading ramp, 24/7 security and CCTV.", 180_000_000, "month", "alborz", "انبارهای ستاره کرج", "Setareh Karaj Warehouses", 4.6, 1, 0, 0),
    ("rent", "transport", "کامیون یخچال‌دار ۱۰ تن", "10-ton refrigerated truck", "دمای ۲۰- تا ۸+، ردیاب GPS و گزارش دما در طول مسیر.", "−20 to +8 °C, GPS tracking and in-transit temperature logs.", 9_000_000, "day", "isfahan", "ترابر سرد سپاهان", "Sepahan Cold Freight", 4.8, 1, 1, 1),
    ("sale", "industrial", "دستگاه تزریق پلاستیک ۲۵۰ تن", "250-ton injection molding machine", "کارکرده، سالم و آماده بهره‌برداری. امکان بازدید در محل.", "Used, in working order. On-site inspection available.", 3_800_000_000, "item", "mashhad", "پلاستیک توس", "Toos Plastics", 4.5, 1, 0, 0),
    ("rent", "industrial", "دستگاه برش لیزر فایبر ۳ کیلووات", "3 kW fiber laser cutter", "میز ۳×۱.۵ متر، برش ورق فولادی تا ۱۶ میلی‌متر.", "3×1.5 m bed, cuts steel sheet up to 16 mm.", 12_000_000, "day", "tehran", "فلزکار دقیق", "Daghigh Metalworks", 4.9, 1, 1, 1),
    ("rent", "mining", "لودر ولوو L120", "Volvo L120 wheel loader", "جام ۳.۵ مترمکعب، مناسب معدن و سنگ‌شکن.", "3.5 m³ bucket, built for quarry and crusher work.", 24_000_000, "day", "isfahan", "معدن‌کاران زاگرس", "Zagros Mining Co.", 4.6, 1, 1, 0),
    ("rent", "mining", "دریل واگن حفاری", "Crawler drill rig", "قطر حفاری ۷۶ تا ۱۱۵ میلی‌متر، همراه کمپرسور.", "76–115 mm hole diameter, compressor included.", 35_000_000, "day", "shiraz", "حفار فارس", "Fars Drilling", 4.4, 0, 1, 0),
    ("service", "maintenance", "تعمیر و اورهال گیربکس صنعتی", "Industrial gearbox overhaul", "عیب‌یابی، تعویض قطعات و تست بار با گارانتی ۶ ماهه.", "Diagnostics, parts replacement and load test with 6-month warranty.", 45_000_000, "project", "ahvaz", "فن‌آوران کارون", "Karun Tech Services", 4.7, 1, 0, 0),
    ("service", "personnel", "اپراتور مجرب جرثقیل (پایه یک)", "Certified crane operator (Grade 1)", "۱۲ سال سابقه، دارای گواهینامه ایمنی و بیمه مسئولیت.", "12 years' experience, safety-certified and liability-insured.", 6_500_000, "day", "tehran", "نیروگستر پایتخت", "Paytakht Staffing", 4.9, 1, 1, 1),
    ("service", "personnel", "تیم ۴ نفره جوشکار آرگون", "4-person TIG welding crew", "جوشکاری لوله و مخازن تحت فشار، دارای تاییدیه بازرسی.", "Pipe and pressure-vessel welding, inspection-approved.", 22_000_000, "day", "isfahan", "جوش صنعت سپاهان", "Sepahan Weld Works", 4.8, 1, 1, 0),
    ("service", "transport", "حمل ترافیکی با کمرشکن", "Heavy haulage (lowbed)", "حمل ماشین‌آلات سنگین تا ۶۰ تن با اسکورت و مجوز تردد.", "Heavy machinery up to 60 t, escort and permits included.", 60_000_000, "project", "ahvaz", "ترابر جنوب", "Jonoub Haulage", 4.5, 1, 1, 0),
    ("rent", "lab", "دستگاه تست کشش ۵۰ کیلونیوتن", "50 kN universal tensile tester", "کالیبره‌شده با گواهی معتبر، نرم‌افزار گزارش‌گیری.", "Calibrated with valid certificate, reporting software included.", 7_000_000, "day", "tehran", "آزمایشگاه مواد پارس", "Pars Materials Lab", 4.8, 1, 0, 0),
    ("rent", "lab", "دوربین حرارتی صنعتی", "Industrial thermal camera", "دقت ۰.۰۵ درجه، مناسب ممیزی انرژی و تابلو برق.", "0.05 °C sensitivity, ideal for energy audits and switchgear.", 2_800_000, "day", "shiraz", "پایش انرژی شیراز", "Shiraz Energy Audit", 4.6, 1, 0, 0),
    ("sale", "warehouse", "قفسه‌بندی پالت‌راک ۴۰۰ پالتی", "Pallet racking, 400 positions", "برچیده‌شده و آماده حمل، همراه نقشه نصب.", "Dismantled and ready to ship, with install drawings.", 1_450_000_000, "item", "mashhad", "انبار شرق", "Shargh Storage", 4.3, 0, 0, 0),
    ("rent", "construction", "داربست مدولار ۲٬۰۰۰ متری", "Modular scaffolding, 2,000 m²", "نصب و برچیدن توسط تیم آموزش‌دیده، استاندارد ایمنی.", "Erected and dismantled by trained crew, safety-compliant.", 70_000_000, "month", "mashhad", "داربست رضوی", "Razavi Scaffolding", 4.5, 1, 1, 0),
    ("rent", "industrial", "دیزل ژنراتور ۵۰۰ کاوا", "500 kVA diesel generator", "کابین سایلنت، تابلو اتوماتیک و سوخت‌رسانی در محل.", "Silent canopy, auto transfer switch, on-site refuelling.", 15_000_000, "day", "alborz", "نیرو پایا", "Niroo Paya Power", 4.9, 1, 1, 1),
    ("request", "construction", "نیازمند بیل مکانیکی برای ۲ هفته", "Excavator needed for 2 weeks", "پروژه گودبرداری در اصفهان، شروع از هفته آینده.", "Excavation project in Isfahan, starting next week.", 350_000_000, "project", "isfahan", "پیمانکاری آسمان", "Aseman Contracting", 4.6, 1, 0, 0),
    ("request", "transport", "۳ کامیون کمپرسی برای پروژه جاده", "3 dump trucks for a road project", "قرارداد ۴۵ روزه، پرداخت مرحله‌ای.", "45-day contract, milestone payments.", 8_000_000, "day", "shiraz", "راه‌سازان پارس", "Pars Road Builders", 4.4, 1, 0, 0),
    ("request", "personnel", "۲ تکنسین برق صنعتی، فوری", "2 industrial electricians, urgent", "تعمیرات خط تولید، شیفت روز، ۱۰ روز کاری.", "Production-line repairs, day shift, 10 working days.", 5_000_000, "day", "tehran", "صنایع غذایی مهر", "Mehr Food Industries", 4.7, 1, 0, 1),
    ("request", "warehouse", "انبار سرد ۵۰۰ متری برای ۳ ماه", "500 m² cold storage for 3 months", "نزدیک آزادراه کرج، دمای ۴+ درجه.", "Near the Karaj freeway, +4 °C.", 120_000_000, "month", "alborz", "پخش سبز", "Sabz Distribution", 4.5, 0, 0, 0),
    ("sale", "transport", "تریلی کفی ۳ محور", "3-axle flatbed trailer", "مدل ۱۴۰۰، لاستیک نو، سند آزاد.", "2021 model, new tyres, clear title.", 2_900_000_000, "item", "ahvaz", "ترابر جنوب", "Jonoub Haulage", 4.5, 1, 0, 0),
    ("service", "maintenance", "بازرسی و کالیبراسیون تجهیزات", "Equipment inspection & calibration", "صدور گواهی معتبر برای ترازو، فشارسنج و دماسنج صنعتی.", "Certified calibration for scales, pressure and temperature gauges.", 1_800_000, "hour", "isfahan", "کالیبر سپاهان", "Sepahan Calibration", 4.8, 1, 0, 0),
]

COLS = "deal, category, title_fa, title_en, desc_fa, desc_en, price, unit, city, company_fa, company_en, rating, verified, insured, featured"


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with closing(db()) as conn, conn:
        conn.executescript(f"""
            CREATE TABLE IF NOT EXISTS listings (
                id INTEGER PRIMARY KEY, {COLS},
                created_at TEXT DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY, listing_id INTEGER REFERENCES listings(id),
                company TEXT, phone TEXT, start TEXT, end TEXT, message TEXT, estimate INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        """)
        if not conn.execute("SELECT 1 FROM listings LIMIT 1").fetchone():
            conn.executemany(f"INSERT INTO listings ({COLS}) VALUES ({','.join('?' * 15)})", SEED)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Floow2 API", lifespan=lifespan)


def row(r: sqlite3.Row) -> dict:
    d = dict(r)
    for k in ("verified", "insured", "featured"):
        d[k] = bool(d[k])
    return d


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/listings")
def listings(
    q: str = "",
    deal: Deal | None = None,
    category: Category | None = None,
    city: City | None = None,
    featured: bool | None = None,
    sort: Literal["new", "price_asc", "price_desc", "rating"] = "new",
    limit: int = Query(60, le=100),
):
    where, args = [], []
    if q:
        where.append("(title_fa LIKE ? OR title_en LIKE ? OR company_fa LIKE ? OR company_en LIKE ?)")
        args += [f"%{q}%"] * 4
    for col, val in (("deal", deal), ("category", category), ("city", city)):
        if val:
            where.append(f"{col} = ?")
            args.append(val)
    if featured is not None:
        where.append("featured = ?")
        args.append(int(featured))
    order = {"new": "id DESC", "price_asc": "price", "price_desc": "price DESC", "rating": "rating DESC"}[sort]
    sql = f"SELECT * FROM listings {'WHERE ' + ' AND '.join(where) if where else ''} ORDER BY {order} LIMIT ?"
    with closing(db()) as conn:
        return [row(r) for r in conn.execute(sql, [*args, limit])]


@app.get("/api/listings/{listing_id}")
def listing(listing_id: int):
    with closing(db()) as conn:
        r = conn.execute("SELECT * FROM listings WHERE id = ?", (listing_id,)).fetchone()
    if not r:
        raise HTTPException(404, "Listing not found")
    return row(r)


class ListingIn(BaseModel):
    deal: Deal
    category: Category
    title: str = Field(min_length=3, max_length=120)
    description: str = Field("", max_length=2000)
    price: int = Field(gt=0, le=10**13)
    unit: Unit
    city: City
    company: str = Field(min_length=2, max_length=80)


@app.post("/api/listings", status_code=201)
def create_listing(body: ListingIn):
    vals = (body.deal, body.category, body.title, body.title, body.description, body.description,
            body.price, body.unit, body.city, body.company, body.company, 5.0, 0, 0, 0)
    with closing(db()) as conn, conn:
        cur = conn.execute(f"INSERT INTO listings ({COLS}) VALUES ({','.join('?' * 15)})", vals)
    return listing(cur.lastrowid)


class InquiryIn(BaseModel):
    company: str = Field(min_length=2, max_length=80)
    phone: str = Field(pattern=r"^(\+98|0)?9\d{9}$")
    start: date | None = None
    end: date | None = None
    message: str = Field("", max_length=1000)

    @model_validator(mode="after")
    def check_dates(self):
        if self.start and self.end and self.end < self.start:
            raise ValueError("end must be on or after start")
        return self


def estimate(price: int, unit: str, start: date | None, end: date | None) -> int:
    if not (start and end) or unit not in ("day", "month"):
        return price
    days = (end - start).days + 1
    return price * days if unit == "day" else price * -(-days // 30)


@app.post("/api/listings/{listing_id}/inquiries", status_code=201)
def create_inquiry(listing_id: int, body: InquiryIn):
    item = listing(listing_id)
    total = estimate(item["price"], item["unit"], body.start, body.end)
    with closing(db()) as conn, conn:
        cur = conn.execute(
            "INSERT INTO inquiries (listing_id, company, phone, start, end, message, estimate) VALUES (?,?,?,?,?,?,?)",
            (listing_id, body.company, body.phone, body.start and str(body.start), body.end and str(body.end), body.message, total),
        )
    return {"id": cur.lastrowid, "estimate": total}


@app.get("/api/stats")
def stats():
    with closing(db()) as conn:
        r = conn.execute("""
            SELECT COUNT(*) AS listings, COUNT(DISTINCT company_en) AS companies,
                   COUNT(DISTINCT city) AS cities, ROUND(AVG(rating), 1) AS rating,
                   (SELECT COUNT(*) FROM inquiries) AS inquiries
            FROM listings""").fetchone()
        cats = conn.execute("SELECT category, COUNT(*) AS n FROM listings GROUP BY category").fetchall()
    return {**dict(r), "categories": {c["category"]: c["n"] for c in cats}}
