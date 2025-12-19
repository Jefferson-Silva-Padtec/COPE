// ===== EFEITOS INTERATIVOS COM CURSOR DO MOUSE =====

// 1. ORBE DE GLOW SEGUINDO O CURSOR
function initCursorGlow() {
    const canvas = document.createElement('canvas');
    canvas.id = 'cursor-glow-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    let targetX = mouseX;
    let targetY = mouseY;
    
    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    });
    
    function drawGlow() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Suaviza o movimento do orbe
        mouseX += (targetX - mouseX) * 0.15;
        mouseY += (targetY - mouseY) * 0.15;
        
        // Desenha o gradiente radial de glow
        const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 150);
        
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        if (theme === 'dark') {
            gradient.addColorStop(0, 'rgba(0, 191, 255, 0.3)');
            gradient.addColorStop(0.5, 'rgba(30, 144, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(0, 123, 255, 0.2)');
            gradient.addColorStop(0.5, 'rgba(0, 123, 255, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 123, 255, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        requestAnimationFrame(drawGlow);
    }
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    
    drawGlow();
}

// 2. PARTÍCULAS FLUTUANTES INTERATIVAS
function initFloatingParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.id = 'particles-container';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
        overflow: hidden;
    `;
    document.body.insertBefore(particleContainer, document.body.firstChild);
    
    const particles = [];
    const particleCount = 15;
    
    class Particle {
        constructor() {
            this.x = Math.random() * window.innerWidth;
            this.y = Math.random() * window.innerHeight;
            this.size = Math.random() * 2 + 1;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
            this.element = document.createElement('div');
            this.element.className = 'particle';
            particleContainer.appendChild(this.element);
        }
        
        update(mouseX, mouseY) {
            // Movimento básico
            this.x += this.vx;
            this.y += this.vy;
            
            // Atração para o cursor (suave)
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                this.vx += dx * 0.0002;
                this.vy += dy * 0.0002;
            }
            
            // Bounce nas bordas
            if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
            if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;
            
            // Mantém dentro dos limites
            this.x = Math.max(0, Math.min(window.innerWidth, this.x));
            this.y = Math.max(0, Math.min(window.innerHeight, this.y));
            
            this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        }
    }
    
    // Cria partículas
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animate() {
        particles.forEach(particle => particle.update(mouseX, mouseY));
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', () => {
        // Reinicializa as partículas se necessário
    });
    
    animate();
}

// 3. EFEITO DE RIPPLE NO CLIQUE
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 999;
            animation: rippleAnimation 0.6s ease-out;
        `;
        
        document.body.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
}

// 4. EFEITO DE PARALLAX NO SCROLL
function initParallaxEffect() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;
    
    window.addEventListener('scroll', () => {
        parallaxElements.forEach(element => {
            const speed = element.getAttribute('data-parallax') || 0.5;
            element.style.transform = `translateY(${window.scrollY * speed}px)`;
        });
    });
}

// 5. HOVER GLOW EM CARDS
function initCardGlowOnHover() {
    const cards = document.querySelectorAll('.card, .card-link');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Cria um elemento de light que segue o cursor
            let light = card.querySelector('.card-light');
            if (!light) {
                light = document.createElement('div');
                light.className = 'card-light';
                card.appendChild(light);
            }
            
            light.style.left = x + 'px';
            light.style.top = y + 'px';
            light.style.opacity = '0.8';
        });
        
        card.addEventListener('mouseleave', () => {
            const light = card.querySelector('.card-light');
            if (light) {
                light.style.opacity = '0';
            }
        });
    });
}

// 6. BACKGROUND ANIMADO RESPONSIVO
function initAnimatedBackground() {
    const style = document.createElement('style');
    style.textContent = `
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(
                    circle at 20% 50%,
                    rgba(0, 191, 255, 0.05) 0%,
                    transparent 50%
                ),
                radial-gradient(
                    circle at 80% 80%,
                    rgba(30, 144, 255, 0.05) 0%,
                    transparent 50%
                );
            animation: gradientShift 15s ease-in-out infinite;
            z-index: 0;
            pointer-events: none;
        }
        
        @keyframes gradientShift {
            0%, 100% {
                background-position: 0% 0%;
            }
            50% {
                background-position: 100% 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

// 7. INICIALIZA TODOS OS EFEITOS AO CARREGAR A PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda um pouco para garantir que o DOM está pronto
    setTimeout(() => {
        initCursorGlow();
        initFloatingParticles();
        initRippleEffect();
        initParallaxEffect();
        initCardGlowOnHover();
        initAnimatedBackground();
    }, 100);
});

// Reinicializa efeitos quando o tema muda
const originalSetAttribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function(name, value) {
    originalSetAttribute.call(this, name, value);
    if (name === 'data-theme') {
        // O canvas será atualizado automaticamente na próxima frame
    }
};
