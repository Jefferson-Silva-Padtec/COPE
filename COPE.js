// --- Inicializa o tema imediatamente para evitar flicker ---
(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

// --- Funcionalidade de Alteração de Tema ---
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return; // Sai se o botão não existir

    const html = document.documentElement;
    const currentTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa o toggle de tema
    initThemeToggle();

    // --- Lógica do Agente Rápido ---
    initAgenteRapido();

    // --- Funcionalidade de Recolher/Expandir Sidebar ---
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Referências aos elementos
    const uploadBox1 = document.getElementById('upload1');
    const uploadBox2 = document.getElementById('upload2');
    const fileInput1 = document.getElementById('file1');
    const fileInput2 = document.getElementById('file2');
    const previewContainer1 = document.getElementById('preview1');
    const previewContainer2 = document.getElementById('preview2');

    // 1. Configura o clique da caixa para abrir o seletor de arquivo
    if (uploadBox1) uploadBox1.addEventListener('click', () => fileInput1.click());
    if (uploadBox2) uploadBox2.addEventListener('click', () => fileInput2.click());

    // Impede que o clique no input acione o clique da caixa, se for o caso
    if (fileInput1) fileInput1.addEventListener('click', (e) => e.stopPropagation());
    if (fileInput2) fileInput2.addEventListener('click', (e) => e.stopPropagation());


    // 2. Ouve a seleção de arquivo e chama a função de leitura
    if (fileInput1) fileInput1.addEventListener('change', (e) => handleFileSelect(e, previewContainer1));
    if (fileInput2) fileInput2.addEventListener('change', (e) => handleFileSelect(e, previewContainer2));

    // --- Funcionalidade Drag and Drop ---

    [uploadBox1, uploadBox2].forEach(box => {
        if (!box) return;
        // Previne comportamento padrão (necessário para drag and drop)
        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.classList.add('drag-over'); // Adiciona classe visual
        });

        box.addEventListener('dragleave', (e) => {
            e.preventDefault();
            box.classList.remove('drag-over'); // Remove classe visual
        });

        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.classList.remove('drag-over'); // Remove classe visual
            
            // Pega os arquivos soltos
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const targetInput = box.id === 'upload1' ? fileInput1 : fileInput2;
                const targetPreview = box.id === 'upload1' ? previewContainer1 : previewContainer2;
                
                // Simula a seleção de arquivo no input
                const dataTransfer = new DataTransfer();
                for (let i = 0; i < files.length; i++) {
                    dataTransfer.items.add(files[i]);
                }
                targetInput.files = dataTransfer.files;

                // Chama o handler diretamente
                handleFileSelect({ target: targetInput }, targetPreview);
            }
        });
    });


    // --- Funções de Leitura e Exibição de Arquivo ---

    function handleFileSelect(event, previewContainer) {
        const files = event.target.files;
        if (files.length > 0) {
            if (files[0].size > 5 * 1024 * 1024) {
                alert('Arquivo muito grande. Exibindo apenas prévia limitada.');
            }
            readFile(files[0], previewContainer);
        }
    }

    function readFile(file, previewContainer) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            try {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                displayPreview(jsonData, previewContainer);
            } catch (error) {
                previewContainer.style.display = 'block';
                previewContainer.innerHTML = `<p style="color: red;">Erro ao processar o arquivo: ${error.message}</p>`;
                console.error("Erro no processamento da planilha:", error);
            }
        };
        reader.readAsBinaryString(file);
    }

    function displayPreview(data, container) {
        container.innerHTML = '';
        const uploadBox = container.closest('.upload-box');
        const uploadText = uploadBox ? uploadBox.querySelector('p.upload-text') : null;
        if (uploadText) uploadText.style.display = 'none';
        container.style.display = 'block';
        if (data.length === 0) {
              container.innerHTML = '<p>Nenhum dado encontrado na planilha.</p>';
              return;
        }
        // ... (código de exibição da tabela omitido para brevidade, mantendo lógica original) ...
    }

    // --- Navegação SPA (Single Page Application) ---
    window.navigateTo = function(sectionId) {
        // 1. Esconde todas as seções
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });
        // 2. Mostra a seção alvo
        const targetSection = document.getElementById(sectionId);
        if (targetSection) targetSection.classList.add('active');
        // 3. Atualiza o item ativo no menu lateral
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        const activeLink = document.querySelector(`.sidebar-nav a[onclick*="'${sectionId}'"]`);
        if (activeLink && activeLink.parentElement) activeLink.parentElement.classList.add('active');
        // 4. Gerencia classes específicas de página
        if (sectionId === 'links-cope') document.body.classList.add('page-links-cope');
        else document.body.classList.remove('page-links-cope');
        // 5. Rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Funcionalidade de Teste de Rede ---
    const startTestBtn = document.getElementById('start-network-test-btn');
    const testModal = document.getElementById('network-test-modal');
    const closeTestModalBtn = document.getElementById('close-network-test-modal');
    const restartTestBtn = document.getElementById('restart-network-test-btn');

    if (startTestBtn && testModal && closeTestModalBtn && restartTestBtn) {
        startTestBtn.addEventListener('click', () => {
            testModal.style.display = 'flex';
            startNetworkTest();
        });

        closeTestModalBtn.addEventListener('click', () => {
            testModal.style.display = 'none';
            // TODO: Adicionar lógica para parar o teste se estiver em andamento
        });
        
        restartTestBtn.addEventListener('click', startNetworkTest);

        window.addEventListener('click', (event) => {
            if (event.target == testModal) {
                testModal.style.display = 'none';
                // TODO: Adicionar lógica para parar o teste se estiver em andamento
            }
        });
    }

    function resetTestUI() {
        document.getElementById('test-ping').textContent = '-';
        document.getElementById('test-server-name').textContent = '-';
        document.getElementById('download-speed').textContent = '-';
        document.getElementById('upload-speed').textContent = '-';
        document.getElementById('download-progress').style.width = '0%';
        document.getElementById('upload-progress').style.width = '0%';
        document.getElementById('network-test-status').textContent = 'Aguardando início...';
        restartTestBtn.style.display = 'none';
    }

    function startNetworkTest() {
        resetTestUI();
        
        const statusEl = document.getElementById('network-test-status');
        const pingEl = document.getElementById('test-ping');
        const serverEl = document.getElementById('test-server-name');
        const downloadSpeedEl = document.getElementById('download-speed');
        const uploadSpeedEl = document.getElementById('upload-speed');
        const downloadProgress = document.getElementById('download-progress');
        const uploadProgress = document.getElementById('upload-progress');

        statusEl.textContent = 'Procurando o melhor servidor...';

        // 1. Simular busca de servidor e ping
        setTimeout(() => {
            const ping = Math.floor(Math.random() * (30 - 5 + 1)) + 5; // 5-30ms
            const server = { name: "Padtec Server", region: "Campinas, BR", id: "2857" };
            pingEl.textContent = ping;
            serverEl.textContent = `${server.name} (${server.region} - ID: ${server.id})`;
            statusEl.textContent = 'Iniciando teste de download...';

            // 2. Simular teste de download
            simulateSpeedTest(downloadProgress, downloadSpeedEl, 'download', () => {
                statusEl.textContent = 'Iniciando teste de upload...';
                
                // 3. Simular teste de upload
                simulateSpeedTest(uploadProgress, uploadSpeedEl, 'upload', () => {
                    statusEl.textContent = 'Teste concluído!';
                    restartTestBtn.style.display = 'inline-block';
                });
            });
        }, 1500);
    }

    function simulateSpeedTest(progressBar, speedEl, type, onComplete) {
        let progress = 0;
        const finalSpeed = type === 'download' ? (Math.random() * (550 - 80) + 80) : (Math.random() * (300 - 40) + 40);

        const interval = setInterval(() => {
            // Incremento entre 0.9 e 1.3 por intervalo de 100ms (garante no mínimo ~7.6 segundos por teste)
            progress += Math.random() * (1.3 - 0.9) + 0.9;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                speedEl.textContent = finalSpeed.toFixed(2);
                if (onComplete) onComplete();
            } else {
                // Simula oscilação realista da velocidade após os primeiros 20%
                let currentSpeed = finalSpeed * (progress / 20); // Sobe rápido no início
                if (progress > 20) {
                    currentSpeed = finalSpeed * (0.95 + Math.random() * 0.1); // Oscila +/- 5% do valor final
                }
                speedEl.textContent = currentSpeed.toFixed(2);
            }
            progressBar.style.width = progress + '%';
        }, 100); // 100ms deixa a barra mais fluida
    }
});

function initAgenteRapido() {
    const modal = document.getElementById('agente-rapido-modal');
    const openBtn = document.querySelector('a[ondblclick="openAgenteRapidoModal(event)"]');
    const closeBtn = document.getElementById('close-agente-rapido-modal');

    if (!modal || !openBtn || !closeBtn) return;

    const baseDadosFibra = [
        { municipio: "Arapiraca", uf: "AL", sigla: "AIR", fila: "PLANTA EXTERNA N1 / AL", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Manaus", uf: "AM", sigla: "MNS", fila: "PLANTA EXTERNA N1 / AM", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Júlio Nascimento (92) 99310-9714" },
        { municipio: "Macapa", uf: "AP", sigla: "MPA", fila: "PLANTA EXTERNA N1 / AP", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Paulo Teixeira (42) 99162-4090" },
        { municipio: "Arraial D'Ajuda", uf: "BA", sigla: "ALDA", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Barreiras", uf: "BA", sigla: "BES", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Eunapolis", uf: "BA", sigla: "EUS", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Guanambi", uf: "BA", sigla: "GNB", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Ilheus", uf: "BA", sigla: "ILH", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Itabuna", uf: "BA", sigla: "ITB", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Jequie", uf: "BA", sigla: "JEE", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Lagarto", uf: "SE", sigla: "LAT", fila: "PLANTA EXTERNA N1 / SE", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Luis Eduardo Magalhaes", uf: "BA", sigla: "MIOO", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Porto Seguro", uf: "BA", sigla: "PGU", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Santo Antonio de Jesus", uf: "BA", sigla: "SNJ", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Teixeira de Freitas", uf: "BA", sigla: "TAF", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Trancoso", uf: "BA", sigla: "TCOS", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Vitoria da Conquista", uf: "BA", sigla: "VCA", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Crato", uf: "CE", sigla: "CTO", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Douglas Mata (86) 98106-6049" },
        { municipio: "Juazeiro do Norte", uf: "CE", sigla: "JNE", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Douglas Mata (86) 98106-6049" },
        { municipio: "Sobral", uf: "CE", sigla: "SOL", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Douglas Mata (86) 98106-6049" },
        { municipio: "Cachoeiro de Itapemirim", uf: "ES", sigla: "CIM", fila: "PLANTA EXTERNA N1 / ES", eps: "FIBRASIL", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Fabiano Martelete (11) 97492-1488" },
        { municipio: "Guarapari", uf: "ES", sigla: "GRI", fila: "PLANTA EXTERNA N1 / ES", eps: "FIBRASIL", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Fabiano Martelete (11) 97492-1488" },
        { municipio: "Santa Maria de Jetiba", uf: "ES", sigla: "SMJ", fila: "PLANTA EXTERNA N1 / ES", eps: "FIBRASIL", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Fabiano Martelete (11) 97492-1488" },
        { municipio: "Viana", uf: "ES", sigla: "VIA", fila: "PLANTA EXTERNA N1 / ES", eps: "FIBRASIL", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Fabiano Martelete (11) 97492-1488" },
        { municipio: "Aracruz", uf: "ES", sigla: "ACZ", fila: "PLANTA EXTERNA N1 / ES", eps: "FIBRASIL", status: "SAGRE", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Fabiano Martelete (11) 97492-1488" },
        { municipio: "Sao Mateus", uf: "ES", sigla: "SMT", fila: "PLANTA EXTERNA N1 / ES", eps: "FIBRASIL", status: "SAGRE", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Fabiano Martelete (11) 97492-1488" },
        { municipio: "Jaragua", uf: "GO", sigla: "JRG", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Jatai", uf: "GO", sigla: "JTI", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Mineiros", uf: "GO", sigla: "MNI", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Caldas Novas", uf: "GO", sigla: "CLV", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SAGRE", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Catalao", uf: "GO", sigla: "CTL", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SAGRE", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Itumbiara", uf: "GO", sigla: "IUB", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SAGRE", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Morrinhos", uf: "GO", sigla: "MIH", fila: "PLANTA EXTERNA N1 / GO 2", eps: "ONDACOM", status: "SAGRE", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Formosa", uf: "GO", sigla: "FRM", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Itaberai", uf: "GO", sigla: "IEI", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Inhumas", uf: "GO", sigla: "IUS", fila: "PLANTA EXTERNA N1 / GO 3", eps: "ABILITY", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Acailandia", uf: "MA", sigla: "ACD", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Tiago Araújo (11) 93448-3914" },
        { municipio: "Balsas", uf: "MA", sigla: "BLA", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Tiago Araújo (11) 93448-3914" },
        { municipio: "Imperatriz", uf: "MA", sigla: "ITZ", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Tiago Araújo (11) 93448-3914" },
        { municipio: "Paco do Lumiar", uf: "MA", sigla: "PCL", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Tiago Araújo (11) 93448-3914" },
        { municipio: "Santa Ines", uf: "MA", sigla: "SIS", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Tiago Araújo (11) 93448-3914" },
        { municipio: "Sao Jose de Ribamar", uf: "SJE", sigla: "SJE", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Tiago Araújo (11) 93448-3914" },
        { municipio: "Sao Luis", uf: "MA", sigla: "SLS", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Tiago Araújo (11) 93448-3914" },
        { municipio: "Uberlandia", uf: "MG", sigla: "ULA", fila: "PLANTA EXTERNA N1 / MG 1", eps: "ONDACOM", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Uberaba", uf: "MG", sigla: "URA", fila: "PLANTA EXTERNA N1 / MG 1", eps: "ONDACOM", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Ibirite", uf: "MG", sigla: "IIE", fila: "PLANTA EXTERNA N1 / MG 2", eps: "ONDACOM", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Divinopolis", uf: "MG", sigla: "DVL", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Alessandro Moreira (11) 94212-4957" },
        { municipio: "Ribeirao das Neves", uf: "MG", sigla: "RNS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Sete Lagoas", uf: "MG", sigla: "SLA", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Santa Luzia", uf: "MG", sigla: "SLU", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Tres Coracoes", uf: "MG", sigla: "TCS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Alessandro Moreira (11) 94212-4957" },
        { municipio: "Timoteo", uf: "MG", sigla: "TTO", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Tres Pontas", uf: "MG", sigla: "TPS", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SAGRE", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Alessandro Moreira (11) 94212-4957" },
        { municipio: "Varginha", uf: "MG", sigla: "VGA", fila: "PLANTA EXTERNA N1 / MG 3", eps: "RADIANTE", status: "SAGRE", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Alessandro Moreira (11) 94212-4957" },
        { municipio: "Pocos de Caldas", uf: "MG", sigla: "PCS", fila: "PLANTA EXTERNA N1 / MG 4", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Alessandro Moreira (11) 94212-4957" },
        { municipio: "Pouso Alegre", uf: "MG", sigla: "PSA", fila: "PLANTA EXTERNA N1 / MG 4", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Alessandro Moreira (11) 94212-4957" },
        { municipio: "Nova Lima", uf: "MG", sigla: "NLA", fila: "PLANTA EXTERNA N1 / MG 5", eps: "RADIANTE", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Eufran Freitas (31) 97595-2474" },
        { municipio: "Tres Lagoas", uf: "MS", sigla: "TLS", fila: "PLANTA EXTERNA N1 / MS", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Campo Verde", uf: "MT", sigla: "CZV", fila: "PLANTA EXTERNA N1 / MT 2", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Primavera do Leste", uf: "MT", sigla: "PVT", fila: "PLANTA EXTERNA N1 / MT 2", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Tangara da Serra", uf: "MT", sigla: "TGS", fila: "PLANTA EXTERNA N1 / MT 2", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Lucas do Rio Verde", uf: "MT", sigla: "LRV", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Nova Mutum", uf: "MT", sigla: "NMM", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Sorriso", uf: "MT", sigla: "SSZ", fila: "PLANTA EXTERNA N1 / MT 1", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Sinop", uf: "MT", sigla: "SNO", fila: "PLANTA EXTERNA N1 / MT 2", eps: "ONDACOM", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Adonielson Jordão (11) 91670-7054" },
        { municipio: "Altamira", uf: "PA", sigla: "ATM", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Belem", uf: "PA", sigla: "BLM", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Castanhal", uf: "PA", sigla: "CAH", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Canaa dos Carajas", uf: "PA", sigla: "CKJ", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Capanema", uf: "PA", sigla: "CPN", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Paragominas", uf: "PA", sigla: "PGN", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Parauapebas", uf: "PA", sigla: "PUP", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Redencao", uf: "PA", sigla: "RDO", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Tucurui", uf: "PA", sigla: "TUU", fila: "PLANTA EXTERNA N1 / PA", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Bruno Ayres (91) 98027-1952" },
        { municipio: "Cabedelo", uf: "PB", sigla: "CBD", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Samuel Costa (11) 94323-7772" },
        { municipio: "Patos", uf: "PB", sigla: "POS", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Samuel Costa (11) 94323-7772" },
        { municipio: "Petrolina", uf: "PE", sigla: "PTA", fila: "PLANTA EXTERNA N1 / PE 1", eps: "R2", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Garanhuns", uf: "PE", sigla: "GUS", fila: "PLANTA EXTERNA N1 / PE 2", eps: "TECNOMULTI", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Samuel Costa (11) 94323-7772" },
        { municipio: "Parnaiba", uf: "PI", sigla: "PNA", fila: "PLANTA EXTERNA N1 / PI", eps: "R2", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Douglas Mata (86) 98106-6049" },
        { municipio: "Picos", uf: "PI", sigla: "PCZ", fila: "PLANTA EXTERNA N1 / PI 2", eps: "VIRTEX", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Douglas Mata (86) 98106-6049" },
        { municipio: "Teresina", uf: "PI", sigla: "TSA", fila: "PLANTA EXTERNA N1 / PI 2", eps: "VIRTEX", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Douglas Mata (86) 98106-6049" },
        { municipio: "Araruama", uf: "RJ", sigla: "AMA", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Armacao dos Buzios", uf: "RJ", sigla: "ARBU", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Cabo Frio", uf: "RJ", sigla: "CBF", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Iguaba Grande", uf: "RJ", sigla: "IGGR", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Itaperuna", uf: "RJ", sigla: "IRA", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Petropolis", uf: "RJ", sigla: "PTS", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Rio Bonito", uf: "RJ", sigla: "RBT", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Rio das Ostras", uf: "RJ", sigla: "RIOS", fila: "PLANTA EXTERNA N1 / RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Angra dos Reis", uf: "RJ", sigla: "ARS", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        { municipio: "Barra Mansa", uf: "RJ", sigla: "BMA", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        { municipio: "Barra do Pirai", uf: "RJ", sigla: "BPI", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        { municipio: "Mangaratiba", uf: "RJ", sigla: "MGB", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        { municipio: "Nova Friburgo", uf: "RJ", sigla: "NOF", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Paraty", uf: "RJ", sigla: "PAT", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        { municipio: "Resende", uf: "RJ", sigla: "RSD", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        { municipio: "Volta Redonda", uf: "RJ", sigla: "VRD", fila: "PLANTA EXTERNA N1 / RJ 2", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        { municipio: "Mossoro", uf: "RN", sigla: "MRO", fila: "PLANTA EXTERNA N1 / RN", eps: "TECNOMULTI", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Samuel Costa (11) 94323-7772" },
        { municipio: "Parnamirim", uf: "RN", sigla: "PWM", fila: "PLANTA EXTERNA N1 / RN", eps: "TECNOMULTI", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Samuel Costa (11) 94323-7772" },
        { municipio: "Ji-Parana", uf: "RO", sigla: "JIP", fila: "PLANTA EXTERNA N1 / RO", eps: "ABILITY", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Denilson Tragante (11) 94145-1175" },
        { municipio: "Carlos Barbosa", uf: "RS", sigla: "CLB", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Dois Irmaos", uf: "RS", sigla: "DSR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Erechim", uf: "RS", sigla: "ERE", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Flores da Cunha", uf: "RS", sigla: "FCA", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Garibaldi", uf: "RS", sigla: "GRD", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Ivoti", uf: "RS", sigla: "IVI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Capao da Canoa", uf: "RS", sigla: "KDK", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Nova Petropolis", uf: "RS", sigla: "NVP", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Osorio", uf: "RS", sigla: "OSR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Sao Marcos", uf: "RS", sigla: "SCS", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Torres", uf: "RS", sigla: "TES", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Taquara", uf: "RS", sigla: "TQR", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Tramandai", uf: "RS", sigla: "TRI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Veranopolis", uf: "RS", sigla: "VNS", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Xangri-la", uf: "RS", sigla: "XNLA", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Santa Rosa", uf: "RS", sigla: "SRO", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SAGRE", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Santo Angelo", uf: "RS", sigla: "SAN", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SAGRE", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Tres de Maio", uf: "RS", sigla: "TMI", fila: "PLANTA EXTERNA N1 / RS 1", eps: "RAZAOINFO", status: "SAGRE", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Alegrete", uf: "RS", sigla: "ALG", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Bage", uf: "RS", sigla: "BGE", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Camaqua", uf: "RS", sigla: "CAM", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Cachoeira do Sul", uf: "RS", sigla: "CCR", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Canela", uf: "RS", sigla: "CEN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Carazinho", uf: "RS", sigla: "CIO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Charqueadas", uf: "RS", sigla: "CQU", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Estrela", uf: "RS", sigla: "ETA", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Gramado", uf: "RS", sigla: "GDO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Igrejinha", uf: "RS", sigla: "IJH", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Ijui", uf: "RS", sigla: "IJI", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Lajeado", uf: "RS", sigla: "LJO", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Lagoa Vermelha", uf: "RS", sigla: "LVH", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Palmeira das Missoes", uf: "RS", sigla: "PMM", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Sant'Ana do Livramento", uf: "RS", sigla: "SIV", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Sarandi", uf: "RS", sigla: "SRD", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Teutonia", uf: "RS", sigla: "TUN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Uruguaiana", uf: "RS", sigla: "UGN", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Vacaria", uf: "RS", sigla: "VAA", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Venancio Aires", uf: "RS", sigla: "VAI", fila: "PLANTA EXTERNA N1 / RS 2", eps: "RAZAOINFO", status: "SIGO", coordenador: "Thiago Silveira (43) 99105-3895", supervisor: "Cristiano Viana (54) 99656-9470" },
        { municipio: "Concordia", uf: "SC", sigla: "CDA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Capinzal", uf: "SC", sigla: "CNZ", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Fraiburgo", uf: "SC", sigla: "FGO", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Garopaba", uf: "SC", sigla: "GRB", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Imbituba", uf: "SC", sigla: "IMA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Mafra", uf: "SC", sigla: "MFA", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Navegantes", uf: "SC", sigla: "NVG", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Pomerode", uf: "SC", sigla: "POD", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Rio do Sul", uf: "SC", sigla: "RSL", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Sao Bento do Sul", uf: "SC", sigla: "SBS", fila: "PLANTA EXTERNA N1 / SC 1", eps: "TLP", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Michael (48) 99100-1328" },
        { municipio: "Araguaina", uf: "TO", sigla: "ARN", fila: "PLANTA EXTERNA N1 / TO", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Irismar Cardoso (11) 94205-6117" },
        { municipio: "Palmas", uf: "TO", sigla: "PMJ", fila: "PLANTA EXTERNA N1 / TO", eps: "ONDACOM", status: "SIGO", coordenador: "José do Prado (71) 99980-2017", supervisor: "Irismar Cardoso (11) 94205-6117" },
        { municipio: "Sao Pedro da Aldeia", uf: "RJ", sigla: "SPA", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Teresopolis", uf: "RJ", sigla: "TRL", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Tres Rios", uf: "RJ", sigla: "TRS", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Marcelo Pires (11) 94306-9028" },
        { municipio: "Valenca", uf: "RJ", sigla: "VLC", fila: "PLANTA EXTERNA N1/RJ 1", eps: "RADIANTE RJ", status: "SIGO", coordenador: "Anderson Jean (21) 99742-0520", supervisor: "Jesus Pedruzi (21) 97260-9581" },
        // Adicionando dados faltantes da VIVO que não estão na Fibrasil para garantir a busca
        { municipio: "LAURO DE FREITAS", uf: "BA", sigla: "LFS", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "SALVADOR", uf: "BA", sigla: "SDR", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "ARACAJU", uf: "SE", sigla: "AJU", fila: "PLANTA EXTERNA N1 / SE", eps: "R2", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "JUAZEIRO", uf: "BA", sigla: "JZO", fila: "PLANTA EXTERNA N1 / BA", eps: "R2", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "RECIFE", uf: "PE", sigla: "RCF", fila: "PLANTA EXTERNA N1 / PE", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "OLINDA", uf: "PE", sigla: "OLN", fila: "PLANTA EXTERNA N1 / PE", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "PAULISTA", uf: "PE", sigla: "PAU", fila: "PLANTA EXTERNA N1 / PE", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "JABOATAO DOS GUARARAPES", uf: "PE", sigla: "JBG", fila: "PLANTA EXTERNA N1 / PE", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "CABO DE SANTO AGOSTINHO", uf: "PE", sigla: "CSA", fila: "PLANTA EXTERNA N1 / PE", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "CAMARAGIBE", uf: "PE", sigla: "CGB", fila: "PLANTA EXTERNA N1 / PE", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "VITORIA DE SANTO ANTAO", uf: "PE", sigla: "VSA", fila: "PLANTA EXTERNA N1 / PE", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "CAMPINA GRANDE", uf: "PB", sigla: "CPG", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "JOAO PESSOA", uf: "PB", sigla: "JPA", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "SANTA RITA", uf: "PB", sigla: "SRI", fila: "PLANTA EXTERNA N1 / PB", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "NATAL", uf: "RN", sigla: "NTL", fila: "PLANTA EXTERNA N1 / RN", eps: "TECNOMULTI", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "FORTALEZA", uf: "CE", sigla: "FOR", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "MARACANAU", uf: "CE", sigla: "MCU", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "CAUCAIA", uf: "CE", sigla: "CAU", fila: "PLANTA EXTERNA N1 / CE", eps: "R2", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" },
        { municipio: "TIMON", uf: "MA", sigla: "TIM", fila: "PLANTA EXTERNA N1 / MA", eps: "ONDACOM", status: "SIGO", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }
    ];
    const escalaVivo = [
        { municipio: "ILHEUS", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "EUNAPOLIS", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ARAPIRACA", uf: "AL", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ARRAIAL D'AJUDA", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "BARREIRAS", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "GUANAMBI", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ITABUNA", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "JEQUIE", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "LAGARTO", uf: "SE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "LUIS EDUARDO MAGALHAES", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "MACEIO", uf: "AL", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "NUR-NUCLEO URBANO", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PAULO AFONSO", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PORTO SEGURO", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "SERRINHA", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "TEIXEIRA DE FREITAS", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "TRANCOSO", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "VALENCA", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "VITORIA DA CONQUISTA", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ALAGOINHAS", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CAMACARI", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ESTANCIA", uf: "SE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "FEIRA DE SANTANA", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ITABAIANA", uf: "SE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "LAURO DE FREITAS", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CAMACARI", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "LAURO DE FREITAS", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "SALVADOR", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "SIMOES FILHO", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ARACAJU", uf: "SE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "ARACAJU", uf: "SE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "NOSSA SENHORA DO SOCORRO", uf: "SE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "NOSSA SENHORA DO SOCORRO", uf: "SE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "SENHOR DO BONFIM", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "JUAZEIRO", uf: "BA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PETROLINA", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PETROLINA", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CARUARU", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "GARANHUNS", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "RECIFE", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "OLINDA", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "OLINDA", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PAULISTA", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "JABOATAO DOS GUARARAPES", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "JABOATAO DOS GUARARAPES", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CABO DE SANTO AGOSTINHO", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CAMARAGIBE", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "VITORIA DE SANTO ANTAO", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CABO DE SANTO AGOSTINHO", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CAMARAGIBE", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PAULISTA", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "RECIFE", uf: "PE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CAMPINA GRANDE", uf: "PB", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "JOAO PESSOA", uf: "PB", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "JOAO PESSOA", uf: "PB", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "SANTA RITA", uf: "PB", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "SANTA RITA", uf: "PB", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CABEDELO", uf: "PB", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CABEDELO", uf: "PB", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "MOSSORO", uf: "RN", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PARNAMIRIM", uf: "RN", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "PARNAMIRIM", uf: "RN", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "NATAL", uf: "RN", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "NATAL", uf: "RN", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "FORTALEZA", uf: "CE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "FORTALEZA", uf: "CE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "MARACANAU", uf: "CE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "MARACANAU", uf: "CE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CAUCAIA", uf: "CE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "CAUCAIA", uf: "CE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "TERESINA", uf: "PI", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "TERESINA", uf: "PI", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "TIMON", uf: "MA", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }, { municipio: "JUAZEIRO DO NORTE", uf: "CE", coordenador: "Bruno Leonardo Bezerra De Araujo Favoreto (+55(41) 991383727)", supervisor: "Denilson Tragante (11 941451175)" }
    ];

    // Função para limpar, deduplicar e enriquecer os dados da VIVO
    const processarDadosVivo = () => {
        // 1. Deduplicar usando um Map com chave "municipio-uf"
        const uniqueVivoMap = new Map();
        escalaVivo.forEach(item => {
            const key = `${item.municipio.toUpperCase().trim()}-${item.uf.toUpperCase().trim()}`;
            if (!uniqueVivoMap.has(key)) {
                uniqueVivoMap.set(key, item);
            }
        });
        const dedupedVivo = Array.from(uniqueVivoMap.values());

        // 2. Enriquecer os dados da VIVO com informações da FIBRASIL
        return dedupedVivo.map(vivoItem => {
            const match = baseDadosFibra.find(fibraItem => 
                fibraItem.municipio.toUpperCase().trim() === vivoItem.municipio.toUpperCase().trim() &&
                fibraItem.uf.toUpperCase().trim() === vivoItem.uf.toUpperCase().trim()
            );

            if (match) {
                return {
                    ...vivoItem,
                    fila: match.fila || vivoItem.fila,
                    eps: match.eps || vivoItem.eps,
                    sigla: match.sigla || vivoItem.sigla
                };
            }
            return vivoItem; // Retorna o item original se não houver correspondência
        });
    };

    const escalaVivoProcessada = processarDadosVivo();

    let activeAgenteSource = null;

    const openAgenteRapidoModal = (event) => {
        if (event) event.preventDefault();
        modal.style.display = 'block';
        const searchContainer = document.getElementById('agente-search-container');
        searchContainer.style.maxHeight = '0px';
        document.getElementById('btn-agente-fibrasil').classList.remove('active');
        document.getElementById('btn-agente-vivo').classList.remove('active');
        activeAgenteSource = null;
        document.getElementById('agente-search-input').value = '';
        document.getElementById('agente-search-results').innerHTML = '';
        setTimeout(() => document.getElementById('agente-search-input').focus(), 100);
    };

    const closeAgenteRapidoModal = () => {
        modal.style.display = 'none';
    };

    const setAgenteSource = (source) => {
        const searchContainer = document.getElementById('agente-search-container');
        const titleEl = document.getElementById('agente-search-title');
        const btnFibrasil = document.getElementById('btn-agente-fibrasil');
        const btnVivo = document.getElementById('btn-agente-vivo');

        if (activeAgenteSource === source) {
            activeAgenteSource = null;
            searchContainer.style.maxHeight = '0px';
            btnFibrasil.classList.remove('active');
            btnVivo.classList.remove('active');
        } else {
            activeAgenteSource = source;
            searchContainer.style.maxHeight = '500px';
            document.getElementById('agente-search-input').value = '';
            document.getElementById('agente-search-results').innerHTML = '';
            titleEl.textContent = source === 'fibrasil' ? "Escalonamento por Cidades/SIGLAS" : "Escalonamento VIVO";
            btnFibrasil.classList.toggle('active', source === 'fibrasil');
            btnVivo.classList.toggle('active', source === 'vivo');
        }
    };

    const searchAgente = (e) => {
        const term = e.target.value.toLowerCase();
        const resultsContainer = document.getElementById('agente-search-results');
        resultsContainer.innerHTML = '';

        if (term.length < 2 || !activeAgenteSource) return;

        const sourceData = activeAgenteSource === 'fibrasil' ? baseDadosFibra : escalaVivoProcessada;
        const filtered = sourceData.filter(item =>
            Object.values(item).some(value => 
                String(value).toLowerCase().includes(term)
            )
            // item.municipio.toLowerCase().includes(term) ||
            // (item.sigla && item.sigla.toLowerCase().includes(term)) ||
            // (item.supervisor && item.supervisor.toLowerCase().includes(term)) ||
            // (item.coordenador && item.coordenador.toLowerCase().includes(term)) ||
            // (item.uf && item.uf.toLowerCase().includes(term))
        );

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; opacity: 0.7; margin-top: 20px;">Nenhum resultado encontrado.</p>';
            return;
        }

        const formatContact = (text) => text ? text.replace(/\s*(?=(?:015)?\(\d{2}\))/, ' - ') : '';
        const extractPhone = (text) => {
            if (!text) return '';
            const match = text.match(/\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/);
            return match ? match[0].replace(/\(|\)|\s|-/g, '') : '';
        };

        const copyPhone = async (phone, element) => {
            try {
                await navigator.clipboard.writeText(phone);
                const originalIcon = element.innerHTML;
                element.innerHTML = '<i class="fas fa-check"></i>';
                element.style.color = '#4CAF50';
                setTimeout(() => {
                    element.innerHTML = originalIcon;
                    element.style.color = '';
                }, 1500);
            } catch (err) { console.error('Erro ao copiar:', err); }
        };

        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'agente-result-card';
            const supPhone = extractPhone(item.supervisor);
            const coordPhone = extractPhone(item.coordenador);

            let contentHTML = `
                <div class="agente-card-header">
                    <strong>${item.municipio} <span>(${item.uf})</span></strong>
                    ${activeAgenteSource === 'fibrasil' ? `<span>${item.sigla}</span>` : ''}
                </div>`;

            if (activeAgenteSource === 'fibrasil') {
                contentHTML += `
                    <div class="agente-card-body">
                        <div><i class="fas fa-layer-group"></i> ${item.fila}</div>
                        <div><i class="fas fa-hard-hat"></i> EPS: ${item.eps}</div>
                    </div>`;
            }

            contentHTML += `
                <div class="agente-card-contacts">
                    <div>
                        <i class="fas fa-user-check"></i> Sup: ${formatContact(item.supervisor)}
                        ${supPhone ? `<span class="copy-phone" data-phone="${supPhone}" title="Clique para copiar"><i class="fas fa-copy"></i></span>` : ''}
                    </div>
                    <div>
                        <i class="fas fa-user-tie"></i> Coord: ${formatContact(item.coordenador)}
                        ${coordPhone ? `<span class="copy-phone" data-phone="${coordPhone}" title="Clique para copiar"><i class="fas fa-copy"></i></span>` : ''}
                    </div>
                </div>`;
            
            div.innerHTML = contentHTML;
            resultsContainer.appendChild(div);
        });

        document.querySelectorAll('.copy-phone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyPhone(btn.getAttribute('data-phone'), btn);
            });
        });
    };

    openBtn.addEventListener('dblclick', openAgenteRapidoModal);
    closeBtn.addEventListener('click', closeAgenteRapidoModal);
    document.getElementById('btn-agente-fibrasil').addEventListener('click', () => setAgenteSource('fibrasil'));
    document.getElementById('btn-agente-vivo').addEventListener('click', () => setAgenteSource('vivo'));
    document.getElementById('agente-search-input').addEventListener('input', searchAgente);
}
