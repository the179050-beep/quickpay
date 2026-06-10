import { Router } from "express";

const router = Router();

const BANKS = [
  {
    value: "ABK",
    label: "Al Ahli Bank of Kuwait",
    cardPrefixes: ["406974", "406975", "521653", "521654"],
  },
  {
    value: "ALRAJHI",
    label: "Al Rajhi Bank",
    cardPrefixes: ["408250", "408251", "524767", "524768"],
  },
  {
    value: "BBK",
    label: "Bank of Bahrain and Kuwait",
    cardPrefixes: ["406780", "406781", "519812", "519813"],
  },
  {
    value: "BOUBYAN",
    label: "Boubyan Bank",
    cardPrefixes: ["410161", "410162", "521900", "521901"],
  },
  {
    value: "BURGAN",
    label: "Burgan Bank",
    cardPrefixes: ["411390", "411391", "521634", "521635"],
  },
  {
    value: "CBK",
    label: "Commercial Bank of Kuwait",
    cardPrefixes: ["406799", "406800", "525943", "525944"],
  },
  {
    value: "Doha",
    label: "Doha Bank",
    cardPrefixes: ["409700", "409701", "527253", "527254"],
  },
  {
    value: "GBK",
    label: "Gulf Bank",
    cardPrefixes: ["406401", "406402", "519212", "519213"],
  },
  {
    value: "TAM",
    label: "TAM Bank",
    cardPrefixes: ["401880", "401881", "526127", "526128"],
  },
  {
    value: "KFH",
    label: "Kuwait Finance House",
    cardPrefixes: ["408069", "408070", "524050", "524051"],
  },
  {
    value: "KIB",
    label: "Kuwait International Bank",
    cardPrefixes: ["419521", "419522", "531730", "531731"],
  },
  {
    value: "NBK",
    label: "National Bank of Kuwait",
    cardPrefixes: ["409201", "409202", "516741", "516742"],
  },
  {
    value: "Weyay",
    label: "Weyay Bank",
    cardPrefixes: ["432985", "432986", "543210", "543211"],
  },
  {
    value: "QNB",
    label: "Qatar National Bank",
    cardPrefixes: ["420067", "420068", "529147", "529148"],
  },
  {
    value: "UNB",
    label: "Union National Bank",
    cardPrefixes: ["414775", "414776", "528460", "528461"],
  },
  {
    value: "WARBA",
    label: "Warba Bank",
    cardPrefixes: ["411500", "411501", "519537", "519538"],
  },
];

router.get("/", (_req, res) => {
  res.json(BANKS);
});

export default router;
