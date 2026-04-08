export type Locale = 'pt' | 'en';

const translations = {
  pt: {
    // Landing page - Hero
    'hero.title': 'Transforme Audio em Texto com IA',
    'hero.description': 'Transcreva reunioes, aulas, entrevistas e qualquer conteudo de audio com precisao. Upload de arquivos, links do YouTube ou gravacao ao vivo.',
    'hero.cta': 'Comecar',
    'hero.dashboard': 'Ver Dashboard',

    // Landing page - Pipeline
    'pipeline.label': 'Pipeline',
    'pipeline.title': 'Como funciona',
    'pipeline.description': 'Cada audio passa por 4 etapas automaticas, do input ate a transcricao final formatada.',
    'pipeline.step': 'Etapa',
    'pipeline.step1.title': 'Captura de Audio',
    'pipeline.step1.description': 'O audio e capturado via upload de arquivo, download de YouTube (yt-dlp), ou microfone do navegador via WebSocket.',
    'pipeline.step2.title': 'Speech-to-Text (Deepgram)',
    'pipeline.step2.description': 'O audio e enviado para a API Deepgram Nova-3, que converte fala em texto com alta precisao, suportando multiplos idiomas.',
    'pipeline.step3.title': 'Transcricao Bruta',
    'pipeline.step3.description': 'O texto bruto retornado pelo Deepgram e salvo. Inclui timestamps, duracao e metadados da fonte original.',
    'pipeline.step4.title': 'Processamento com IA (Groq)',
    'pipeline.step4.description': 'O Llama 3.3 70B via Groq formata, organiza e limpa a transcricao. Voce pode customizar o prompt de processamento.',

    // Landing page - Features
    'features.title': 'Tres formas de transcrever',
    'features.audio.title': 'Arquivos de Audio',
    'features.audio.description': 'Upload de arquivos MP3, WAV, M4A, OGG, FLAC, WebM e AAC com ate 50MB.',
    'features.youtube.title': 'Videos do YouTube',
    'features.youtube.description': 'Cole o link de qualquer video publico do YouTube e extraia o texto completo.',
    'features.mic.title': 'Microfone ao Vivo',
    'features.mic.description': 'Transcreva em tempo real usando seu microfone com Deepgram Nova-3.',

    // Landing page - Tech stack labels
    'tech.speechToText': 'Speech-to-Text',
    'tech.llm': 'LLM',
    'tech.realtime': 'Realtime',
    'tech.frontend': 'Frontend',
    'tech.styling': 'Styling',

    // Header
    'header.newTranscription': 'Nova Transcricao',
    'header.dashboard': 'Dashboard',

    // Dashboard
    'dashboard.title': 'Suas Transcricoes',
    'dashboard.count.singular': 'transcricao salva',
    'dashboard.count.plural': 'transcricoes salvas',
    'dashboard.tab.all': 'Todas',
    'dashboard.tab.file': 'Arquivos',
    'dashboard.tab.youtube': 'YouTube',
    'dashboard.tab.realtime': 'Microfone',
    'dashboard.empty.all': 'Nenhuma transcricao ainda.',
    'dashboard.empty.type': 'Nenhuma transcricao do tipo',
    'dashboard.createButton': 'Criar Transcricao',
    'dashboard.delete.title': 'Excluir transcricao',
    'dashboard.delete.description': 'Tem certeza que deseja excluir esta transcricao? Esta acao nao pode ser desfeita.',
    'dashboard.delete.tooltip': 'Excluir',
    'dashboard.noContent': 'Sem conteudo disponivel.',

    // Source labels (used in dashboard cards)
    'source.file': 'Arquivo',
    'source.youtube': 'YouTube',
    'source.realtime': 'Microfone',

    // Detail page
    'detail.notFound': 'Transcricao nao encontrada.',
    'detail.backToDashboard': 'Voltar ao Dashboard',
    'detail.copyText': 'Copiar texto',
    'detail.exportTxt': 'Exportar TXT',
    'detail.delete': 'Excluir',
    'detail.promptUsed': 'Prompt utilizado:',
    'detail.status.completed': 'Completada',
    'detail.status.failed': 'Falhou',
    'detail.tab.processed': 'Processada',
    'detail.tab.raw': 'Original',
    'detail.noContent': 'Nenhum conteudo de transcricao disponivel.',
    'detail.errorMessage': 'Ocorreu um erro ao processar sua transcricao. Por favor, tente novamente.',
    'detail.createNew': 'Criar Nova Transcricao',
    'detail.reprocess.title': 'Reprocessar com novo prompt',
    'detail.reprocess.placeholder': 'Ex: Crie uma lista com os principais topicos discutidos...',
    'detail.reprocess.button': 'Reprocessar',
    'detail.reprocess.processing': 'Reprocessando...',
    'detail.reprocess.cancel': 'Cancelar',
    'detail.reprocess.cta': 'Nao esta satisfeito? Reprocesse com um prompt diferente.',
    'detail.reprocess.ctaButton': 'Reprocessar com Novo Prompt',
    'detail.reprocess.error': 'Falha ao reprocessar.',
    'detail.source.file': 'Arquivo de Audio',
    'detail.source.youtube': 'Video do YouTube',
    'detail.source.realtime': 'Microfone ao Vivo',

    // Footer
    'footer.copyright': 'MeetingsTranscript',
  },

  en: {
    // Landing page - Hero
    'hero.title': 'Transform Audio into Text with AI',
    'hero.description': 'Transcribe meetings, classes, interviews, and any audio content with precision. Upload files, YouTube links, or record live.',
    'hero.cta': 'Get Started',
    'hero.dashboard': 'View Dashboard',

    // Landing page - Pipeline
    'pipeline.label': 'Pipeline',
    'pipeline.title': 'How it works',
    'pipeline.description': 'Each audio goes through 4 automatic stages, from input to the final formatted transcription.',
    'pipeline.step': 'Step',
    'pipeline.step1.title': 'Audio Capture',
    'pipeline.step1.description': 'Audio is captured via file upload, YouTube download (yt-dlp), or browser microphone via WebSocket.',
    'pipeline.step2.title': 'Speech-to-Text (Deepgram)',
    'pipeline.step2.description': 'Audio is sent to the Deepgram Nova-3 API, which converts speech to text with high accuracy, supporting multiple languages.',
    'pipeline.step3.title': 'Raw Transcription',
    'pipeline.step3.description': 'The raw text returned by Deepgram is saved. It includes timestamps, duration, and metadata from the original source.',
    'pipeline.step4.title': 'AI Processing (Groq)',
    'pipeline.step4.description': 'Llama 3.3 70B via Groq formats, organizes, and cleans the transcription. You can customize the processing prompt.',

    // Landing page - Features
    'features.title': 'Three ways to transcribe',
    'features.audio.title': 'Audio Files',
    'features.audio.description': 'Upload MP3, WAV, M4A, OGG, FLAC, WebM, and AAC files up to 50MB.',
    'features.youtube.title': 'YouTube Videos',
    'features.youtube.description': 'Paste the link of any public YouTube video and extract the full text.',
    'features.mic.title': 'Live Microphone',
    'features.mic.description': 'Transcribe in real time using your microphone with Deepgram Nova-3.',

    // Landing page - Tech stack labels
    'tech.speechToText': 'Speech-to-Text',
    'tech.llm': 'LLM',
    'tech.realtime': 'Realtime',
    'tech.frontend': 'Frontend',
    'tech.styling': 'Styling',

    // Header
    'header.newTranscription': 'New Transcription',
    'header.dashboard': 'Dashboard',

    // Dashboard
    'dashboard.title': 'Your Transcriptions',
    'dashboard.count.singular': 'saved transcription',
    'dashboard.count.plural': 'saved transcriptions',
    'dashboard.tab.all': 'All',
    'dashboard.tab.file': 'Files',
    'dashboard.tab.youtube': 'YouTube',
    'dashboard.tab.realtime': 'Microphone',
    'dashboard.empty.all': 'No transcriptions yet.',
    'dashboard.empty.type': 'No transcriptions of type',
    'dashboard.createButton': 'Create Transcription',
    'dashboard.delete.title': 'Delete transcription',
    'dashboard.delete.description': 'Are you sure you want to delete this transcription? This action cannot be undone.',
    'dashboard.delete.tooltip': 'Delete',
    'dashboard.noContent': 'No content available.',

    // Source labels (used in dashboard cards)
    'source.file': 'File',
    'source.youtube': 'YouTube',
    'source.realtime': 'Microphone',

    // Detail page
    'detail.notFound': 'Transcription not found.',
    'detail.backToDashboard': 'Back to Dashboard',
    'detail.copyText': 'Copy text',
    'detail.exportTxt': 'Export TXT',
    'detail.delete': 'Delete',
    'detail.promptUsed': 'Prompt used:',
    'detail.status.completed': 'Completed',
    'detail.status.failed': 'Failed',
    'detail.tab.processed': 'Processed',
    'detail.tab.raw': 'Original',
    'detail.noContent': 'No transcription content available.',
    'detail.errorMessage': 'An error occurred while processing your transcription. Please try again.',
    'detail.createNew': 'Create New Transcription',
    'detail.reprocess.title': 'Reprocess with new prompt',
    'detail.reprocess.placeholder': 'E.g.: Create a list of the main topics discussed...',
    'detail.reprocess.button': 'Reprocess',
    'detail.reprocess.processing': 'Reprocessing...',
    'detail.reprocess.cancel': 'Cancel',
    'detail.reprocess.cta': 'Not satisfied? Reprocess with a different prompt.',
    'detail.reprocess.ctaButton': 'Reprocess with New Prompt',
    'detail.reprocess.error': 'Failed to reprocess.',
    'detail.source.file': 'Audio File',
    'detail.source.youtube': 'YouTube Video',
    'detail.source.realtime': 'Live Microphone',

    // Footer
    'footer.copyright': 'MeetingsTranscript',
  },
} as const;

export type TranslationKey = keyof typeof translations.pt;

export function getTranslation(locale: Locale) {
  const dict = translations[locale];
  return function t(key: TranslationKey): string {
    return dict[key] ?? key;
  };
}
