import assert from "node:assert/strict";
import test from "node:test";

import { TUTOR_LIST_HASH, mainUrl, toolsUrl } from "./site";
import { TOOLS } from "./tools";

test("toolsUrl her zaman www alan adı ve /araclar altında", () => {
  assert.equal(toolsUrl(), "https://www.hocamozelders.com/araclar");
  assert.equal(toolsUrl("obp-hesaplama"), "https://www.hocamozelders.com/araclar/obp-hesaplama");
});

test("mainUrl: filtre, UTM ve hash", () => {
  assert.equal(
    mainUrl("/", "tyt-net-hesaplama", { exam_type: "TYT", subject: "Matematik" }, TUTOR_LIST_HASH),
    "https://www.hocamozelders.com/?exam_type=TYT&subject=Matematik&utm_source=araclar&utm_medium=tool&utm_campaign=tyt-net-hesaplama#ys-tutor-list-title",
  );
  assert.equal(
    mainUrl("/yks-ozel-ders", "obp-hesaplama"),
    "https://www.hocamozelders.com/yks-ozel-ders?utm_source=araclar&utm_medium=tool&utm_campaign=obp-hesaplama",
  );
});

test("her araç kaydı benzersiz slug ve sayfa meta sınırlarına sahip", () => {
  const slugs = TOOLS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const t of TOOLS) {
    assert.ok(t.description.length <= 160, `${t.slug} açıklaması 160 karakteri geçiyor`);
    assert.match(t.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
});
