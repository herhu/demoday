import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const JiraListProjectsSchema = z.object({});

export const JiraListProjectsJsonSchema = zodToJsonSchema(JiraListProjectsSchema, "JiraListProjectsSchema");
