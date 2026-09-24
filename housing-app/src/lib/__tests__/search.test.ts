import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPagination, buildSearchOrderBy, buildSearchWhere } from "../search";

test("buildSearchWhere returns an empty filter for no params", () => {
  assert.deepEqual(buildSearchWhere({}), {});
});

test("buildSearchWhere filters by city and locality slug", () => {
  const where = buildSearchWhere({ city: "chennai", locality: "porur" });
  assert.deepEqual(where.city, { slug: "chennai" });
  assert.deepEqual(where.locality, { slug: "porur" });
});

test("buildSearchWhere parses a comma-separated bhk list", () => {
  const where = buildSearchWhere({ bhk: "2, 3" });
  assert.deepEqual(where.bhk, { in: [2, 3] });
});

test("buildSearchWhere drops invalid bhk values silently", () => {
  const where = buildSearchWhere({ bhk: "2,not-a-number,3" });
  assert.deepEqual(where.bhk, { in: [2, 3] });
});

test("buildSearchWhere maps propertyType, keeping only valid enum values", () => {
  const where = buildSearchWhere({ propertyType: "apartment,villa,not-real" });
  assert.deepEqual(where.propertyType, { in: ["APARTMENT", "VILLA"] });
});

test("buildSearchWhere combines priceMin and priceMax into one range filter", () => {
  const where = buildSearchWhere({ priceMin: "1000000", priceMax: "3000000" });
  assert.deepEqual(where.price, { gte: 1000000, lte: 3000000 });
});

test("buildSearchWhere accepts priceMin without priceMax", () => {
  const where = buildSearchWhere({ priceMin: "1000000" });
  assert.deepEqual(where.price, { gte: 1000000 });
});

test("buildSearchWhere builds an OR clause for free-text search", () => {
  const where = buildSearchWhere({ q: "villa" });
  assert.deepEqual(where.OR, [
    { title: { contains: "villa", mode: "insensitive" } },
    { description: { contains: "villa", mode: "insensitive" } },
  ]);
});

test("buildSearchOrderBy maps each sort key, defaulting unknown/relevant to newest-first", () => {
  assert.deepEqual(buildSearchOrderBy("price_asc"), { price: "asc" });
  assert.deepEqual(buildSearchOrderBy("price_desc"), { price: "desc" });
  assert.deepEqual(buildSearchOrderBy("newest"), { createdAt: "desc" });
  assert.deepEqual(buildSearchOrderBy("relevant"), { createdAt: "desc" });
  assert.deepEqual(buildSearchOrderBy(undefined), { createdAt: "desc" });
});

test("buildPagination defaults to page 1 and computes skip/take", () => {
  assert.deepEqual(buildPagination(undefined), { page: 1, skip: 0, take: 20 });
  assert.deepEqual(buildPagination("3"), { page: 3, skip: 40, take: 20 });
});

test("buildPagination floors invalid/negative page numbers to 1", () => {
  assert.equal(buildPagination("0").page, 1);
  assert.equal(buildPagination("-5").page, 1);
  assert.equal(buildPagination("not-a-number").page, 1);
});
