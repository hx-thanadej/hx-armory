# Armory

เว็บให้ developer ติ๊กเลือก Terraform, Helm, Kubernetes YAML หรือคำสั่ง CLI แล้วได้ไฟล์กับคำสั่งไปรันเองทันที ไม่ต้องรอทีมอินฟรา

แอปนี้ **ไม่รันและไม่ apply อะไรเลย** แค่สร้างข้อความให้คัดลอกหรือดาวน์โหลด ไม่มี auth ไม่มี backend ไม่มี credential เป็น static site โฮสต์ที่ไหนก็ได้

## รัน

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test
pnpm build      # ได้ dist/ ไปวางบน static host
```

ค่าที่เลือกเก็บอยู่ใน URL hash ส่งลิงก์ให้เพื่อนแล้วได้หน้าเดิมเป๊ะ

## ทีมอินฟราเพิ่ม item ใหม่

1. สร้างไฟล์ใน `src/catalog/items/` ที่ export `CatalogItem` (ดูตัวอย่างสั้นสุดที่ `k8s-namespace.ts`)
2. เพิ่มเข้า list ใน `src/catalog/index.ts` ลำดับใน list คือลำดับของ output
3. `pnpm test`

ใน template ใช้ `{{key}}` กับ `{{#if key}}...{{/if}}` ได้ ตัวแปรที่มีให้เสมอคือ `project`, `env`, `namespace` และ `dir` (โฟลเดอร์ของ item)

ระบบจะ fail ตั้งแต่ import ถ้า id ซ้ำ, param ชนกับ context key, หรือ param แบบ string ไม่มี `pattern` (ค่าใน URL ต้องไม่หลุดเข้า `deploy.sh` แบบไม่ตรวจ) และเทสต์จะ render ทุก item ด้วยค่า default ให้
