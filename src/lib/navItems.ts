// "সকল কৃষক" (All Farmers) and "সকল জমি" (All Land) intentionally live in the profile
// dropdown menu (AppNavbar), not here — keeping them out of the main nav row avoids
// duplicating the same two links in two places.
export const userNavItems = [
  { label: "ড্যাশবোর্ড", path: "/user/dashboard" },
  { label: "কৃষক", path: "/user/farmers" },
  { label: "জমি", path: "/user/lands" },
  { label: "মৌসুম", path: "/user/seasons" },
  { label: "পেমেন্ট", path: "/user/payments" },
  { label: "একক মূল্য", path: "/user/unit-prices" },
];
