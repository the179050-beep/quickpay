import { Router } from "express";

const router = Router();

const BANKS = [
  { value: "ABK", label: "Al Ahli Bank of Kuwait", cardPrefixes: ["4", "5"] },
  { value: "ALRAJHI", label: "Al Rajhi Bank", cardPrefixes: ["4", "5"] },
  { value: "BBK", label: "Bank of Bahrain and Kuwait", cardPrefixes: ["4", "5"] },
  { value: "BOUBYAN", label: "Boubyan Bank", cardPrefixes: ["4", "5"] },
  { value: "BURGAN", label: "Burgan Bank", cardPrefixes: ["4", "5"] },
  { value: "CBK", label: "Commercial Bank of Kuwait", cardPrefixes: ["4", "5"] },
  { value: "Doha", label: "Doha Bank", cardPrefixes: ["4", "5"] },
  { value: "GBK", label: "Gulf Bank", cardPrefixes: ["4", "5"] },
  { value: "TAM", label: "TAM Bank", cardPrefixes: ["4", "5"] },
  { value: "KFH", label: "Kuwait Finance House", cardPrefixes: ["4", "5"] },
  { value: "KIB", label: "Kuwait International Bank", cardPrefixes: ["4", "5"] },
  { value: "NBK", label: "National Bank of Kuwait", cardPrefixes: ["4", "5"] },
  { value: "Weyay", label: "Weyay Bank", cardPrefixes: ["4", "5"] },
  { value: "QNB", label: "Qatar National Bank", cardPrefixes: ["4", "5"] },
  { value: "UNB", label: "Union National Bank", cardPrefixes: ["4", "5"] },
  { value: "WARBA", label: "Warba Bank", cardPrefixes: ["4", "5"] },
];

router.get("/", (_req, res) => {
  res.json(BANKS);
});

export default router;
