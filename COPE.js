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

    // Referências aos elementos
    const uploadBox1 = document.getElementById('upload1');
    const uploadBox2 = document.getElementById('upload2');
    const fileInput1 = document.getElementById('file1');
    const fileInput2 = document.getElementById('file2');
    const previewContainer1 = document.getElementById('preview1');
    const previewContainer2 = document.getElementById('preview2');

    // 1. Configura o clique da caixa para abrir o seletor de arquivo
    uploadBox1.addEventListener('click', () => fileInput1.click());
    uploadBox2.addEventListener('click', () => fileInput2.click());

    // Impede que o clique no input acione o clique da caixa, se for o caso
    fileInput1.addEventListener('click', (e) => e.stopPropagation());
    fileInput2.addEventListener('click', (e) => e.stopPropagation());


    // 2. Ouve a seleção de arquivo e chama a função de leitura
    fileInput1.addEventListener('change', (e) => handleFileSelect(e, previewContainer1));
    fileInput2.addEventListener('change', (e) => handleFileSelect(e, previewContainer2));

    // --- Funcionalidade Drag and Drop ---

    [uploadBox1, uploadBox2].forEach(box => {
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
                // Cria um DataTransfer para atribuir os arquivos ao input (necessário para acionar o 'change')
                const dataTransfer = new DataTransfer();
                for (let i = 0; i < files.length; i++) {
                    dataTransfer.items.add(files[i]);
                }
                targetInput.files = dataTransfer.files;

                // Chama o handler diretamente (opcional, mas mais limpo)
                handleFileSelect({ target: targetInput }, targetPreview);
            }
        });
    });


    // --- Funções de Leitura e Exibição de Arquivo ---

    function handleFileSelect(event, previewContainer) {
        const files = event.target.files;
        if (files.length > 0) {
            // Se o arquivo for muito grande, limpa a prévia
            if (files[0].size > 5 * 1024 * 1024) { // Exemplo: limite de 5MB
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
                // **SheetJS** - Lê os dados binários
                const workbook = XLSX.read(data, { type: 'binary' });

                // Pega a primeira aba
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // **SheetJS** - Converte a aba em um array de arrays (Array of Arrays - AoA)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Exibe a prévia
                displayPreview(jsonData, previewContainer);

            } catch (error) {
                previewContainer.style.display = 'block';
                previewContainer.innerHTML = `<p style="color: red;">Erro ao processar o arquivo: ${error.message}</p>`;
                console.error("Erro no processamento da planilha:", error);
            }
        };

        // Lê o arquivo como Binário, necessário para o SheetJS
        reader.readAsBinaryString(file);
    }

    function displayPreview(data, container) {
        // Limpa e mostra o contêiner
        container.innerHTML = '';
        
        // Esconde o texto original de upload
        const uploadBox = container.closest('.upload-box');
        const uploadText = uploadBox ? uploadBox.querySelector('p.upload-text') : null;
        if (uploadText) uploadText.style.display = 'none';

        container.style.display = 'block';
        
        if (data.length === 0) {
              container.innerHTML = '<p>Nenhum dado encontrado na planilha.</p>';
              return;
        }

        // Cria a tabela e limita a exibição
        const table = document.createElement('table');
        const rowsToDisplay = data.slice(0, 20); // Limita a 20 linhas de prévia
        const maxColumns = 15; // Limita a 15 colunas de prévia

        rowsToDisplay.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            
            // Limita a exibição de colunas
            const cellsToDisplay = row.slice(0, maxColumns);
            
            cellsToDisplay.forEach((cellData, colIndex) => {
                let cell;
                // A primeira linha é o cabeçalho
                if (rowIndex === 0) {
                    cell = document.createElement('th');
                } else {
                    cell = document.createElement('td');
                }

                // Garante que o valor exibido é uma string vazia se for nulo
                cell.textContent = cellData !== undefined && cellData !== null ? String(cellData) : '';
                tr.appendChild(cell);
            });
            
            // Adiciona indicador se houver mais colunas
            if (row.length > maxColumns) {
                const extraCell = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
                extraCell.textContent = rowIndex === 0 ? '...' : '...';
                tr.appendChild(extraCell);
            }

            table.appendChild(tr);
        });
        
        container.appendChild(table);
        
        // Adiciona indicador se houver mais linhas
        if (data.length > rowsToDisplay.length) {
            const p = document.createElement('p');
            p.textContent = `...e mais ${data.length - rowsToDisplay.length} linhas (prévia limitada).`;
            p.style.fontSize = '0.9em';
            p.style.textAlign = 'center';
            p.style.margin = '10px 0 0 0';
            p.style.color = 'var(--accent-color)';
            container.appendChild(p);
        }
    }
});
