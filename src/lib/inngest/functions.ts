import { inngest } from "@/lib/inngest/client";
import { transcribeAudio, downloadYouTubeAudio, processTranscriptionText } from "@/lib/ai/whisper";
import { processTranscriptionWithAI } from "@/lib/ai/openai";
import { getServiceSupabase } from "@/lib/supabase/client";

export const processFileTranscription = inngest.createFunction(
    { id: "process-file-transcription" },
    { event: "transcription/process-file" },
    async ({ event, step }: { event: any, step: any }) => {
        const { transcriptionId, fileUrl, prompt, userId } = event.data;
        const supabase = getServiceSupabase();

        // Step 1: Transcribe Audio
        const transcriptionResult = await step.run("transcribe-audio", async () => {
            // Get signed URL
            const { data, error } = await supabase.storage
                .from("audio-files")
                .createSignedUrl(fileUrl, 3600); // 1 hour

            if (error || !data?.signedUrl) {
                throw new Error("Failed to generate signed URL");
            }

            return await transcribeAudio(data.signedUrl);
        });

        // Step 2: Process with AI (if prompt exists)
        let processedTranscript = null;
        if (prompt) {
            processedTranscript = await step.run("process-ai", async () => {
                return await processTranscriptionWithAI(transcriptionResult.text, prompt);
            });
        }

        // Step 3: Save results
        await step.run("save-results", async () => {
            // Calculate duration
            const durationSeconds = transcriptionResult.segments.length > 0
                ? Math.ceil(Math.max(...transcriptionResult.segments.map((s: any) => s.end)))
                : 0;

            // Update transcription
            await supabase
                .from("transcriptions")
                .update({
                    status: "completed",
                    transcript_raw: transcriptionResult.text,
                    transcript_processed: processedTranscript,
                    duration_seconds: durationSeconds,
                })
                .eq("id", transcriptionId);

            // Insert segments
            const segments = transcriptionResult.segments.map((segment: any) => ({
                transcription_id: transcriptionId,
                start: segment.start,
                end: segment.end,
                text: segment.text
            }));

            if (segments.length > 0) {
                await supabase.from("transcription_segments").insert(segments);
            }

            // Cleanup file
            await supabase.storage.from("audio-files").remove([fileUrl]);

            // Clear file_url
            await supabase
                .from("transcriptions")
                .update({ file_url: null })
                .eq("id", transcriptionId);
        });

        return { success: true, transcriptionId };
    }
);

export const processYoutubeTranscription = inngest.createFunction(
    { id: "process-youtube-transcription" },
    { event: "transcription/process-youtube" },
    async ({ event, step }: { event: any, step: any }) => {
        const { transcriptionId, youtubeUrl, prompt, userId } = event.data;
        const supabase = getServiceSupabase();

        // Step 1: Download and Transcribe
        const transcriptionResult = await step.run("transcribe-youtube", async () => {
            const audioBuffer = await downloadYouTubeAudio(youtubeUrl);
            return await transcribeAudio(audioBuffer);
        });

        // Step 2: Process with AI
        let processedTranscript = null;
        if (prompt) {
            processedTranscript = await step.run("process-ai", async () => {
                return await processTranscriptionWithAI(transcriptionResult.text, prompt);
            });
        }

        // Step 3: Save results
        await step.run("save-results", async () => {
            // Get video duration (approximate from segments)
            const durationSeconds = transcriptionResult.segments.length > 0
                ? Math.ceil(Math.max(...transcriptionResult.segments.map((s: any) => s.end)))
                : 0;

            await supabase
                .from("transcriptions")
                .update({
                    status: "completed",
                    transcript_raw: transcriptionResult.text,
                    transcript_processed: processedTranscript,
                    duration_seconds: durationSeconds,
                })
                .eq("id", transcriptionId);

            const segments = transcriptionResult.segments.map((segment: any) => ({
                transcription_id: transcriptionId,
                start: segment.start,
                end: segment.end,
                text: segment.text
            }));

            if (segments.length > 0) {
                await supabase.from("transcription_segments").insert(segments);
            }
        });

        return { success: true, transcriptionId };
    }
);
