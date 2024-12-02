// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { IncomingForm } from "formidable";
import fs from "fs";

interface GoogleApiError {
  status: number;
  statusText: string;
  errorDetails: {
    "@type": string;
    reason?: string;
    domain?: string;
    metadata?: {
      service?: string;
    };
    locale?: string;
    message?: string;
  }[];
}

type Data = {
  data?: string;
  message?: string;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const form = new IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err || !files?.file || !fields?.apiKey) {
      console.error(err);
      return res.status(500).json({ message: "Error parsing form data" });
    }
    const apiKey = fields.apiKey[0];

    const genAI = new GoogleGenerativeAI(apiKey);

    const fileManager = new GoogleAIFileManager(genAI.apiKey);

    const file = files.file[0]; // File from the upload
    try {
      if (!file) {
        throw new Error("No file uploaded");
      }
      // Upload the file using GoogleAIFileManager
      const uploadFile = await fileManager.uploadFile(file.filepath, {
        mimeType: file.mimetype || "application/pdf", // Use the correct MIME type
        displayName: new Date().toISOString(), // Use a unique display name
      });

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Generate 5 multiple choice questions to test if user has understood the content of this file correctly. Question should have 4 options out of which only one should be correct. Give result in markdown. Place answer below every question with a label correct:. Each options should be in individual lines starting below the question, No * in front of answer please. Options should be labeled as a, b, c, d. Each questions should be labeled as 1, 2, 3, 4, 5.`;

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            fileUri: uploadFile.file.uri,
            mimeType: uploadFile.file.mimeType,
          },
        },
      ]);

      const markdownContent = result.response.text();
      const data = markdownContent.replace(/(?<!\n)\n(?!\n)/g, "\n\n");

      res.status(200).json({ data });
    } catch (error) {
      const err = error as GoogleApiError;
      const errorDetails = err.errorDetails.filter((error) => error.locale)[0];
      if (errorDetails) {
        res.status(err.status).json({ message: errorDetails.message });
      }

      console.error("Error uploading file to Gemini:", errorDetails.message);
      res.status(500).json({ message: "Error uploading file to Gemini" });
    } finally {
      // Clean up the temporary file
      fs.unlinkSync(file.filepath);
    }
  });
}
