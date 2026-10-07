/** A lowercase slug from words: letters, numbers and single hyphens, at most `max` characters. */
export function slugify(text: string, max = 60): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

/** The id suggested for a new rubric: course, week and title. The admin can edit it until the first save. */
export function suggestRubricId(courseId: string, week: string, title: string): string {
  return slugify([courseId, week, title].filter(Boolean).join(" "));
}
