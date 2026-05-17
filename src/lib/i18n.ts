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

    // New transcription page
    'new.back': 'Voltar',
    'new.title': 'Nova Transcricao',
    'new.subtitle': 'Escolha o metodo de transcricao',
    'new.tab.file': 'Arquivo',
    'new.tab.youtube': 'YouTube',
    'new.tab.realtime': 'Ao Vivo',

    'new.file.title': 'Transcrever Arquivo de Audio',
    'new.file.description': 'MP3, WAV, M4A, OGG, FLAC, WebM, AAC (max 50MB)',
    'new.file.titleLabel': 'Titulo',
    'new.file.titlePlaceholder': 'Ex: Reuniao de Planejamento',
    'new.file.promptLabel': 'Prompt de Processamento (Opcional)',
    'new.file.promptPlaceholder': 'Ex: Destaque os pontos sobre vendas',
    'new.file.promptHelp': 'A IA processara a transcricao com base no prompt.',
    'new.file.errorSelect': 'Selecione um arquivo de audio.',
    'new.file.errorTitle': 'Informe um titulo.',
    'new.file.statusUploading': 'Enviando arquivo...',
    'new.file.statusTranscribing': 'Transcrevendo audio... isso pode levar alguns minutos.',
    'new.file.statusSaving': 'Salvando...',
    'new.file.errorTimeout': 'A requisicao expirou. Tente novamente.',
    'new.file.errorGeneric': 'Falha ao processar o arquivo.',

    'new.youtube.title': 'Transcrever Video do YouTube',
    'new.youtube.description': 'Cole a URL de um video publico para transcrever o audio.',
    'new.youtube.titlePlaceholder': 'Ex: Tutorial de Next.js',
    'new.youtube.urlLabel': 'URL do YouTube',
    'new.youtube.promptPlaceholder': 'Ex: Extraia os principais conceitos',
    'new.youtube.errorTitle': 'Informe um titulo.',
    'new.youtube.errorUrl': 'Forneca uma URL valida do YouTube.',
    'new.youtube.statusProcessing': 'Baixando e transcrevendo... isso pode levar alguns minutos.',
    'new.youtube.errorGeneric': 'Falha ao processar o video.',

    'new.realtime.title': 'Transcricao em Tempo Real',
    'new.realtime.description': 'Use seu microfone para transcrever audio ao vivo.',
    'new.realtime.promptPlaceholder': 'Ex: Faca um resumo estruturado',
    'new.realtime.promptHelp': 'A IA processara a transcricao com base no prompt ao salvar.',
    'new.realtime.errorTitle': 'Informe um titulo.',
    'new.realtime.errorEmpty': 'Grave uma transcricao primeiro.',
    'new.realtime.statusProcessing': 'Processando com IA...',
    'new.realtime.errorGeneric': 'Erro ao salvar.',

    'new.cancel': 'Cancelar',
    'new.submit': 'Iniciar Transcricao',
    'new.submitting': 'Processando...',
    'new.save': 'Salvar Transcricao',
    'new.saving': 'Salvando...',

    // FileUploader
    'uploader.drop': 'Solte o arquivo aqui',
    'uploader.cta': 'Clique para fazer upload ou arraste e solte',
    'uploader.ready': 'Pronto para enviar',
    'uploader.remove': 'Remover arquivo',
    'uploader.errorType': 'Formato nao suportado. Tipos permitidos: {types}',
    'uploader.errorSize': 'O arquivo e muito grande. O tamanho maximo e {size}MB.',
    'uploader.maxHint': '{types} (Max. {size}MB)',

    // YouTubeInput
    'youtubeInput.placeholder': 'https://www.youtube.com/watch?v=...',
    'youtubeInput.errorUrl': 'Por favor, insira uma URL valida do YouTube',
    'youtubeInput.videoLabel': 'Video',
    'youtubeInput.previewDescription': 'Este video sera processado para transcricao.',
    'youtubeInput.lengthHint': 'A transcricao de videos longos pode levar mais tempo. Recomendamos videos de ate 2 horas.',

    // LiveRecorder
    'recorder.unsupported': 'Seu navegador nao suporta gravacao de audio. Use Chrome, Edge ou Firefox.',
    'recorder.start': 'Iniciar Gravacao',
    'recorder.connecting': 'Conectando...',
    'recorder.stop': 'Parar',
    'recorder.retry': 'Tentar Novamente',
    'recorder.listening': 'Ouvindo... comece a falar.',
    'recorder.limit': 'Limite de {minutes} minutos por sessao. Transcricao via Deepgram Nova-3 em portugues.',
    'recorder.permissionDenied': 'Permissao de microfone negada. Habilite o acesso ao microfone nas configuracoes do navegador.',
    'recorder.error.connection_failed': 'Falha ao conectar com o servico de transcricao.',
    'recorder.error.connection_timeout': 'Timeout ao conectar com o servico de transcricao.',
    'recorder.error.connection_closed': 'Conexao com o servico foi encerrada inesperadamente.',
    'recorder.error.unknown': 'Erro desconhecido. Tente novamente.',
    'recorder.error.token': 'Falha ao obter token de transcricao.',

    // Prompt presets
    'presets.label': 'Sugestoes rapidas',
    'presets.summary.label': 'Resumo executivo',
    'presets.summary.prompt': 'Faca um resumo executivo em 3-5 paragrafos, com tom profissional, destacando os pontos principais discutidos.',
    'presets.actions.label': 'Extrair acoes',
    'presets.actions.prompt': 'Liste todas as acoes a serem tomadas (action items) em formato de checklist, indicando o responsavel quando mencionado.',
    'presets.minutes.label': 'Ata de reuniao',
    'presets.minutes.prompt': 'Estruture uma ata de reuniao com: Participantes, Pauta, Decisoes tomadas, Pendencias e Proximos passos.',
    'presets.questions.label': 'Perguntas levantadas',
    'presets.questions.prompt': 'Liste todas as perguntas, duvidas e questoes em aberto levantadas durante a conversa.',

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

    // New transcription page
    'new.back': 'Back',
    'new.title': 'New Transcription',
    'new.subtitle': 'Choose the transcription method',
    'new.tab.file': 'File',
    'new.tab.youtube': 'YouTube',
    'new.tab.realtime': 'Live',

    'new.file.title': 'Transcribe Audio File',
    'new.file.description': 'MP3, WAV, M4A, OGG, FLAC, WebM, AAC (max 50MB)',
    'new.file.titleLabel': 'Title',
    'new.file.titlePlaceholder': 'E.g.: Planning Meeting',
    'new.file.promptLabel': 'Processing Prompt (Optional)',
    'new.file.promptPlaceholder': 'E.g.: Highlight points about sales',
    'new.file.promptHelp': 'AI will process the transcription based on the prompt.',
    'new.file.errorSelect': 'Select an audio file.',
    'new.file.errorTitle': 'Enter a title.',
    'new.file.statusUploading': 'Uploading file...',
    'new.file.statusTranscribing': 'Transcribing audio... this may take a few minutes.',
    'new.file.statusSaving': 'Saving...',
    'new.file.errorTimeout': 'Request timed out. Please try again.',
    'new.file.errorGeneric': 'Failed to process the file.',

    'new.youtube.title': 'Transcribe YouTube Video',
    'new.youtube.description': 'Paste the URL of a public video to transcribe the audio.',
    'new.youtube.titlePlaceholder': 'E.g.: Next.js Tutorial',
    'new.youtube.urlLabel': 'YouTube URL',
    'new.youtube.promptPlaceholder': 'E.g.: Extract the main concepts',
    'new.youtube.errorTitle': 'Enter a title.',
    'new.youtube.errorUrl': 'Provide a valid YouTube URL.',
    'new.youtube.statusProcessing': 'Downloading and transcribing... this may take a few minutes.',
    'new.youtube.errorGeneric': 'Failed to process the video.',

    'new.realtime.title': 'Real-time Transcription',
    'new.realtime.description': 'Use your microphone to transcribe audio live.',
    'new.realtime.promptPlaceholder': 'E.g.: Create a structured summary',
    'new.realtime.promptHelp': 'AI will process the transcription based on the prompt when saving.',
    'new.realtime.errorTitle': 'Enter a title.',
    'new.realtime.errorEmpty': 'Record a transcription first.',
    'new.realtime.statusProcessing': 'Processing with AI...',
    'new.realtime.errorGeneric': 'Error saving.',

    'new.cancel': 'Cancel',
    'new.submit': 'Start Transcription',
    'new.submitting': 'Processing...',
    'new.save': 'Save Transcription',
    'new.saving': 'Saving...',

    // FileUploader
    'uploader.drop': 'Drop the file here',
    'uploader.cta': 'Click to upload or drag and drop',
    'uploader.ready': 'Ready to send',
    'uploader.remove': 'Remove file',
    'uploader.errorType': 'Unsupported format. Allowed types: {types}',
    'uploader.errorSize': 'The file is too large. Maximum size is {size}MB.',
    'uploader.maxHint': '{types} (Max. {size}MB)',

    // YouTubeInput
    'youtubeInput.placeholder': 'https://www.youtube.com/watch?v=...',
    'youtubeInput.errorUrl': 'Please enter a valid YouTube URL',
    'youtubeInput.videoLabel': 'Video',
    'youtubeInput.previewDescription': 'This video will be processed for transcription.',
    'youtubeInput.lengthHint': 'Transcribing long videos may take longer. We recommend videos up to 2 hours.',

    // LiveRecorder
    'recorder.unsupported': 'Your browser does not support audio recording. Use Chrome, Edge or Firefox.',
    'recorder.start': 'Start Recording',
    'recorder.connecting': 'Connecting...',
    'recorder.stop': 'Stop',
    'recorder.retry': 'Try Again',
    'recorder.listening': 'Listening... start speaking.',
    'recorder.limit': '{minutes}-minute limit per session. Transcription via Deepgram Nova-3 in Portuguese.',
    'recorder.permissionDenied': 'Microphone permission denied. Enable microphone access in your browser settings.',
    'recorder.error.connection_failed': 'Failed to connect to the transcription service.',
    'recorder.error.connection_timeout': 'Timed out connecting to the transcription service.',
    'recorder.error.connection_closed': 'Connection to the transcription service was unexpectedly closed.',
    'recorder.error.unknown': 'Unknown error. Please try again.',
    'recorder.error.token': 'Failed to obtain a transcription token.',

    // Prompt presets
    'presets.label': 'Quick suggestions',
    'presets.summary.label': 'Executive summary',
    'presets.summary.prompt': 'Write an executive summary in 3-5 paragraphs, professional tone, highlighting the main points discussed.',
    'presets.actions.label': 'Action items',
    'presets.actions.prompt': 'List all action items as a checklist, indicating the responsible person when mentioned.',
    'presets.minutes.label': 'Meeting minutes',
    'presets.minutes.prompt': 'Structure meeting minutes with: Participants, Agenda, Decisions made, Pending items and Next steps.',
    'presets.questions.label': 'Questions raised',
    'presets.questions.prompt': 'List all questions, doubts and open issues raised during the conversation.',

    // Footer
    'footer.copyright': 'MeetingsTranscript',
  },
} as const;

export type TranslationKey = keyof typeof translations.pt;

export function getTranslation(locale: Locale) {
  const dict = translations[locale];
  return function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const template = dict[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_, name) =>
      vars[name] !== undefined ? String(vars[name]) : `{${name}}`
    );
  };
}
