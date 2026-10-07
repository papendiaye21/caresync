import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../config/env.js";

function client(env: Env): S3Client | null {
  if (
    !env.AWS_REGION ||
    !env.AWS_ACCESS_KEY_ID ||
    !env.AWS_SECRET_ACCESS_KEY
  ) {
    return null;
  }
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export async function getPresignedPutUrl(
  env: Env,
  input: { key: string; contentType: string; expiresSeconds?: number }
): Promise<{ url: string; bucket: string } | null> {
  const c = client(env);
  const bucket = env.AWS_S3_BUCKET;
  if (!c || !bucket) {
    console.warn("[s3] Presigned upload skipped: AWS not configured");
    return null;
  }
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType,
  });
  const url = await getSignedUrl(c, cmd, {
    expiresIn: input.expiresSeconds ?? 900,
  });
  return { url, bucket };
}

export async function getPresignedGetUrl(
  env: Env,
  input: { key: string; expiresSeconds?: number }
): Promise<string | null> {
  const c = client(env);
  const bucket = env.AWS_S3_BUCKET;
  if (!c || !bucket) return null;
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: input.key });
  return getSignedUrl(c, cmd, { expiresIn: input.expiresSeconds ?? 900 });
}
