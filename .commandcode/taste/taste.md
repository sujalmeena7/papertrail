# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# drizzle
- Use plain-pgTable with manual .references() for schema definitions — do not use the relations() helper. Confidence: 0.75
- Use npx drizzle-kit generate for migrations, not the ad-hoc scripts/migrate.ts raw-SQL pattern. Confidence: 0.75

# workflow
- When external services aren't available for verification, stub/skip live calls and state it explicitly rather than claiming end-to-end verification. Confidence: 0.70

