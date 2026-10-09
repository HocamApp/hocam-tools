export const SITE_URL = "https://www.hocamozelders.com";
export const TOOLS_PATH = "/araclar";

/** Ana sitedeki hoca listesi bölümünün id'si (hocam-frontend tutorDirectoryLinks). */
export const TUTOR_LIST_HASH = "ys-tutor-list-title";

export function toolsUrl(slug = ""): string {
  return `${SITE_URL}${TOOLS_PATH}${slug ? `/${slug}` : ""}`;
}

/**
 * Ana siteye mutlak, UTM'li bağlantı. Araçlar ayrı bir uygulama olduğundan
 * ana sitenin sayfalarına <Link> değil mutlak adresle gidilir; doğrudan
 * Vercel adresinden açılsa da bağlantılar kırılmaz.
 */
export function mainUrl(
  path: string,
  campaign: string,
  params: Record<string, string> = {},
  hash = "",
): string {
  const url = new URL(path, SITE_URL);
  const all = { ...params, utm_source: "araclar", utm_medium: "tool", utm_campaign: campaign };
  for (const [key, value] of Object.entries(all)) url.searchParams.set(key, value);
  if (hash) url.hash = hash;
  return url.toString();
}
