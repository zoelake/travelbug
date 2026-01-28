const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

const ENABLE_ANALYTICS =
  process.env.NODE_ENV === "production" && GA_ID.length > 0;

const GA = {
  enabled: ENABLE_ANALYTICS,
  id: GA_ID,
};

export default GA;