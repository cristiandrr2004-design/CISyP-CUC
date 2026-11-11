/*
========================================================================
   PORTAL WEB - CENTRO SOCIOJURÍDICO (CUC)
   LÓGICA PRINCIPAL, INTERACTIVIDAD Y ANIMACIONES GSAP
========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. INICIALIZAR EL ENRUTADOR SPA
    initSPARouter();
    
    // 2. INICIALIZAR BOTÓN BACK TO TOP
    initBackToTop();
    
    // 3. INICIALIZAR LÓGICA DE IDIOMAS
    initLanguageSelector();
    
    // 4. INICIALIZAR FORMULARIOS
    initFormHandlers();
    
    // 5. INICIALIZAR EL ROLLER DE ALIANZAS ESTRATÉGICAS (LOGOLOOP)
    initLogoLoop();

    // 6. INICIALIZAR EL CAROUSEL 3D DE EQUIPO
    initTeamCarousel();
});

/*
========================================================================
   1. ENRUTADOR SPA NATIVO Y GESTIÓN DE VISTAS
========================================================================
*/
function initSPARouter() {
    const views = document.querySelectorAll('.view');
    const navLinks = document.querySelectorAll('nav a, .dropdown-menu a');
    
    const routeMap = {
        '': 'home',
        '#': 'home',
        '#home': 'home',
        '#sobre-rotativo': 'home',
        '#sobre-nosotros': 'sobre-nosotros',
        '#portafolio': 'portafolio',
        '#proyectos': 'proyectos',
        '#lineas-investigacion': 'lineas-investigacion',
        '#equipo': 'equipo',
        '#contacto': 'contacto'
    };

    const handleRouting = () => {
        const hash = window.location.hash;
        const targetViewId = routeMap[hash] || 'home';
        
        // 1. Ocultar todas las subpáginas
        views.forEach(view => {
            view.classList.remove('active');
            view.style.display = 'none';
        });
        
        // 2. Mostrar la subpágina actual
        const activeView = document.getElementById(`view-${targetViewId}`);
        if (activeView) {
            activeView.style.display = 'block';
            setTimeout(() => {
                activeView.classList.add('active');
                triggerViewAnimations(targetViewId);
            }, 10);
        }
        
        // 3. Resaltar pestaña activa del menú
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (linkHref === hash || (hash === '' && linkHref === '#home')) {
                link.classList.add('active');
            }
        });
        
        // Cerrar menú móvil si está abierto
        const nav = document.getElementById('main-navigation');
        const menuToggle = document.querySelector('.menu-toggle');
        if (nav && nav.classList.contains('open')) {
            nav.classList.remove('open');
            if (menuToggle) {
                menuToggle.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        }
        
        // Reset scroll position
        window.scrollTo(0, 0);
    };
    
    // Configurar menú móvil toggler
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('main-navigation');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('open');
            const isOpen = nav.classList.contains('open');
            menuToggle.innerHTML = isOpen 
                ? '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>'
                : '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';
            menuToggle.setAttribute('aria-expanded', isOpen);
        });
        
        document.addEventListener('click', () => {
            nav.classList.remove('open');
            menuToggle.innerHTML = '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>';
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    }

    window.addEventListener('hashchange', handleRouting);
    handleRouting(); // Carga inicial
}

/*
========================================================================
   2. GSAP SCROLL REVEAL Y DETONACIÓN DE COMPONENTES
========================================================================
*/
let slideshowInterval = null;
let progressTween = null;

let servicesSequenceInitialized = false;
let projectsSequenceInitialized = false;

function triggerViewAnimations(viewId) {
    if (window.gsap) {
        gsap.from(`#view-${viewId} .gsap-reveal`, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power2.out',
            clearProps: 'all'
        });
    }

    if (viewId === 'home') {
        initHeroSlideshow();
    } else {
        stopHeroSlideshow();
    }
    
    if (viewId === 'portafolio') {
        initFlipbook();
        if (!servicesSequenceInitialized) {
            initServicesSequence();
            servicesSequenceInitialized = true;
        } else if (window.ScrollTrigger) {
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 200);
        }
    }

    if (viewId === 'proyectos') {
        if (!projectsSequenceInitialized) {
            initProjectsSequence();
            projectsSequenceInitialized = true;
        } else if (window.ScrollTrigger) {
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 200);
        }
    }

    if (viewId === 'lineas-investigacion') {
        if (window.ScrollTrigger) {
            ScrollTrigger.getAll()
                .filter(t => t.vars && t.vars._researchTimeline)
                .forEach(t => t.kill());
        }
        setTimeout(() => {
            initResearchTimeline();
        }, 300);
    }
    if (viewId === 'equipo') {
        if (typeof window.updateTeamCarouselText === 'function') {
            window.updateTeamCarouselText();
        }
    }

    if (window.ScrollTrigger) {
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 200);
    }
}

/*
========================================================================
   TIMELINE ANIMADO PARA LÍNEAS DE INVESTIGACIÓN
========================================================================
*/
function initResearchTimeline() {
    const wrapper = document.getElementById('researchWrapper');
    const progress = document.getElementById('timelineProgress');
    const section = document.getElementById('researchSection');
    const items = document.querySelectorAll('#view-lineas-investigacion .research-item');
    if (!wrapper || !progress || items.length === 0 || !window.gsap || !window.ScrollTrigger) return;

    gsap.to(progress, {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
            trigger: wrapper,
            start: 'top 50%',
            endTrigger: section || wrapper,
            end: 'bottom 50%',
            scrub: 1,
            _researchTimeline: true
        }
    });

    items.forEach((item) => {
        ScrollTrigger.create({
            trigger: item,
            start: 'top 62%',
            end: 'bottom 38%',
            toggleClass: 'active',
            _researchTimeline: true
        });
    });
}

/*
========================================================================
   3. BANNER ROTATIVO DEL HERO (SLIDESHOW AUTOPLAY CON GSAP)
========================================================================
*/
function initHeroSlideshow() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const progressBar = document.querySelector('.progress-bar');
    const prevBtn = document.getElementById('slide-prev-btn');
    const nextBtn = document.getElementById('slide-next-btn');
    
    if (slides.length === 0 || !progressBar) return;
    
    let currentSlideIndex = 0;
    const slideDuration = 6;
    
    const playSlide = (index) => {
        if (progressTween) progressTween.kill();
        progressBar.style.width = '0%';
        
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            if (i === index && window.gsap) {
                gsap.fromTo(slide.querySelector('.slide-bg'), 
                    { opacity: 0.4 }, 
                    { opacity: 1, duration: 1.2, ease: 'power2.out' }
                );
                gsap.fromTo(slide.querySelector('.slide-content'), 
                    { y: 40, opacity: 0 }, 
                    { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.25 }
                );
            }
        });
        
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
        
        currentSlideIndex = index;
        
        if (window.gsap) {
            progressTween = gsap.to(progressBar, {
                width: '100%',
                duration: slideDuration,
                ease: 'none',
                onComplete: () => {
                    const nextIndex = (currentSlideIndex + 1) % slides.length;
                    playSlide(nextIndex);
                }
            });
        }
    };
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            playSlide(index);
        });
    });

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let prevIndex = currentSlideIndex - 1;
            if (prevIndex < 0) prevIndex = slides.length - 1;
            playSlide(prevIndex);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let nextIndex = (currentSlideIndex + 1) % slides.length;
            playSlide(nextIndex);
        });
    }
    
    playSlide(0);
}

function stopHeroSlideshow() {
    if (progressTween) {
        progressTween.kill();
        progressTween = null;
    }
}

/*
========================================================================
   4. BOTÓN FLOTANTE VOLVER ARRIBA (BACK TO TOP)
========================================================================
*/
function initBackToTop() {
    const backBtn = document.getElementById('back-to-top');
    if (!backBtn) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backBtn.classList.add('visible');
        } else {
            backBtn.classList.remove('visible');
        }
    });
    
    backBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/*
========================================================================
   5. SELECTOR DE IDIOMA Y TRADUCCIÓN GLOBAL
========================================================================
*/
let currentLanguage = 'es';

const formTranslations = {
    es: {
        sending: "Enviando...",
        successTitle: "¡Mensaje enviado con éxito!",
        successBody: "El asesor asignado se pondrá en contacto al celular o correo provisto en las próximas horas para coordinar la primera sesión."
    },
    en: {
        sending: "Sending...",
        successTitle: "Message sent successfully!",
        successBody: "The assigned advisor will contact you at the mobile number or email provided in the next few hours to coordinate the first session."
    },
    fr: {
        sending: "Envoi en cours...",
        successTitle: "Message envoyé avec succès !",
        successBody: "Le conseiller affecté vous contactera sur le portable ou l'e-mail fournis dans les prochaines heures pour coordonner la première session."
    }
};

const translationMap = {
    // MAIN NAVIGATION
    "nav a[href='#sobre-nosotros']": {
        es: "Sobre Nosotros",
        en: "About Us",
        fr: "À Propos"
    },
    "nav a[href='#portafolio']": {
        es: "Servicios",
        en: "Services",
        fr: "Services"
    },
    "nav a[href='#proyectos']": {
        es: "Proyectos",
        en: "Projects",
        fr: "Projets"
    },
    "nav a[href='#lineas-investigacion']": {
        es: "Líneas de Investigación",
        en: "Lines of Research",
        fr: "Lignes de Recherche"
    },
    "nav a[href='#equipo']": {
        es: "Equipo",
        en: "Team",
        fr: "Équipe"
    },
    "nav a[href='#contacto']": {
        es: "Contacto",
        en: "Contact",
        fr: "Contact"
    },
    ".nav-btn-vinculacion": {
        es: "Solicitar Asesoría",
        en: "Request Advisory",
        fr: "Demander Conseil"
    },

    // HERO SLIDESHOW (HOME)
    ".slide[data-index='0'] .slide-tag": {
        es: "Líneas de investigación",
        en: "Lines of research",
        fr: "Lignes de recherche"
    },
    ".slide[data-index='0'] h2": {
        es: "Áreas y líneas de investigación jurídica",
        en: "Areas and lines of legal research",
        fr: "Domaines et axes de recherche juridique"
    },
    ".slide[data-index='0'] p": {
        es: "Conozca nuestros campos de estudio en derecho, gobernanza, políticas públicas y sostenibilidad para aportar soluciones reales a los desafíos regionales y nacionales.",
        en: "Discover our fields of study in law, governance, public policy, and sustainability to provide real solutions to regional and national challenges.",
        fr: "Découvrez nos domaines d'études en droit, gouvernance, politiques publiques et durabilité pour apporter des solutions concrètes aux défis régionaux et nationaux."
    },
    ".slide[data-index='0'] .btn": {
        es: "Conocer líneas de investigación",
        en: "Discover lines of research",
        fr: "Découvrir les lignes de recherche"
    },
    ".slide[data-index='1'] .slide-tag": {
        es: "Proyecto de impacto social",
        en: "Social impact project",
        fr: "Projet à impact social"
    },
    ".slide[data-index='1'] h2": {
        es: "Programa Jóvenes para el Mundo en Atlántico",
        en: "Youth for the World Program in Atlántico",
        fr: "Programme Jeunes pour le Monde en Atlántico"
    },
    ".slide[data-index='1'] p": {
        es: "Iniciativa facilitando el acceso a educación superior y para el trabajo mediante apoyos económicos y becas, aportando al cierre de brechas sociales en el departamento del Atlántico.",
        en: "Initiative facilitating access to higher education and job training through financial aid and scholarships, closing social gaps in the Atlántico department.",
        fr: "Initiative facilitant l'accès à l'enseignement supérieur et à la formation professionnelle par des aides financières et des bourses en Atlántico."
    },
    ".slide[data-index='1'] .btn": {
        es: "Ver proyecto",
        en: "View project",
        fr: "Voir le projet"
    },
    ".slide[data-index='2'] .slide-tag": {
        es: "Servicios especializados",
        en: "Specialized services",
        fr: "Services spécialisés"
    },
    ".slide[data-index='2'] h2": {
        es: "Servicios especializados y laboratorios jurídicos",
        en: "Specialized services and legal laboratories",
        fr: "Services spécialisés et laboratoires juridiques"
    },
    ".slide[data-index='2'] p": {
        es: "Acceda a litigio internacional, consultoría técnica, asesoría sociojurídica integral y el uso de laboratorios de última generación como Jurisverso y Cámara de Gesell.",
        en: "Access international litigation, technical consultancy, comprehensive socio-legal advisory, and cutting-edge labs such as Jurisverso and the Gesell Chamber.",
        fr: "Accédez au contentieux international, au conseil technique, à l'assistance socio-juridique et à des laboratoires de pointe tels que Jurisverso et Chambre de Gesell."
    },
    ".slide[data-index='2'] .btn": {
        es: "Ver servicios especializados",
        en: "View specialized services",
        fr: "Voir les services spécialisés"
    },

    // INTRO MULTIMEDIA
    ".intro-tag-pill": {
        es: "Centro de Investigaciones Sociojurídicas y Políticas",
        en: "Socio-Legal and Political Research Center",
        fr: "Centre de Recherches Socio-Juridiques et Politiques"
    },
    ".intro-title": {
        es: "Transformamos conocimiento en soluciones sociojurídicas",
        en: "Transforming knowledge into socio-legal solutions",
        fr: "Nous transformons le savoir en solutions socio-juridiques"
    },
    ".intro-description": {
        es: "El Centro de Investigaciones SocioJurídicas y Políticas (CISyP) del Departamento de Derecho y Ciencias Políticas de la Universidad de la Costa (CUC) promueve, dirige y coordina la investigación en ciencia, tecnología e innovación, brindando soluciones integrales a entidades públicas, organizaciones privadas y comunidades.",
        en: "The Socio-Legal and Political Research Center (CISyP) of the Department of Law and Political Science at Universidad de la Costa (CUC) promotes, directs, and coordinates research in science, technology, and innovation, providing comprehensive solutions to public entities, private organizations, and communities.",
        fr: "Le Centre de Recherches Socio-Juridiques et Politiques (CISyP) du Département de Droit et Sciences Politiques de l'Université de la Costa (CUC) promeut, dirige et coordonne la recherche en science, technologie et innovation, offrant des solutions intégrales aux entités publiques, privées et aux communautés."
    },
    ".intro-action-buttons a[href='#sobre-nosotros']": {
        es: "Conocer más",
        en: "Learn More",
        fr: "En savoir plus"
    },
    ".intro-action-buttons a[href='#lineas-investigacion']": {
        es: "Líneas de investigación",
        en: "Lines of Research",
        fr: "Lignes de recherche"
    },

    // SERVICES TEASER
    ".services-teaser-text .case-tag": {
        es: "Portafolio Profesional",
        en: "Professional Portfolio",
        fr: "Portfolio Professionnel"
    },
    ".services-teaser-text h2": {
        es: "Descubre nuestro portafolio de servicios jurídicos",
        en: "Discover our legal services portfolio",
        fr: "Découvrez notre portfolio de services juridiques"
    },
    ".services-teaser-text p": {
        es: "Conozca la oferta integral del Centro de Investigaciones SocioJurídicas y Políticas (CISyP): asesoría técnica, laboratorios especializados, litigio internacional, consultoría comunitaria en clínica jurídica y formación de alto impacto del Departamento de Derecho y Ciencias Políticas.",
        en: "Explore the comprehensive offerings of the Socio-Legal and Political Research Center (CISyP): technical advisory, specialized laboratories, international litigation, legal clinic community consultancy, and high-impact training from the Department of Law and Political Science.",
        fr: "Découvrez l'offre complète du Centre de Recherches Socio-Juridiques et Politiques (CISyP) : conseil technique, laboratoires spécialisés, contentieux international, clinique juridique et formation à fort impact."
    },
    ".services-teaser-text .btn-outline-custom": {
        es: "Ver nuestros servicios",
        en: "View our services",
        fr: "Voir nos services"
    },

    // FEATURED CASES (HOME)
    ".featured-cases-section .section-title span": {
        es: "Impacto Real",
        en: "Real Impact",
        fr: "Impact Réel"
    },
    ".featured-cases-section .section-title h2": {
        es: "Casos de éxito destacados",
        en: "Featured Success Stories",
        fr: "Cas de Succès Phares"
    },
    ".featured-cases-section .section-title p": {
        es: "Resultados tangibles y alianzas estratégicas del CISyP que respaldan nuestra excelencia técnica y compromiso con la gestión pública e institucional.",
        en: "Tangible results and strategic alliances of CISyP supporting our technical excellence and commitment to public and institutional management.",
        fr: "Des résultats tangibles et des partenariats stratégiques du CISyP attestant de notre excellence technique et de notre engagement institutionnel."
    },
    ".featured-cases-section .case-tag": {
        es: "Servicios Especializados",
        en: "Specialized Services",
        fr: "Services Spécialisés"
    },
    ".featured-cases-section .case-info-col h3": {
        es: "Proceso de Elección Contralor de Pereira",
        en: "Comptroller Election Process in Pereira",
        fr: "Processus d'Élection du Contrôleur de Pereira"
    },
    ".featured-cases-section .case-info-col p": {
        es: "Prestación de servicios especializados para el desarrollo integral de las etapas del proceso de convocatoria pública y elección del contralor municipal de Pereira para la vigencia constitucional 2026 - 2029.",
        en: "Provision of specialized services for the comprehensive execution of the public call and election process of the municipal comptroller of Pereira for the 2026 - 2029 term.",
        fr: "Prestation de services spécialisés pour la réalisation intégrale des étapes du concours public et de l'élection du contrôleur municipal de Pereira (2026 - 2029)."
    },
    ".featured-cases-section .case-info-col .btn-outline-custom": {
        es: "Ver casos de éxito",
        en: "View success stories",
        fr: "Voir les cas de succès"
    },

    // TEAM TEASER (HOME)
    ".team-teaser-tag": {
        es: "Nuestro equipo",
        en: "Our team",
        fr: "Notre équipe"
    },
    ".team-teaser-section h3": {
        es: "Profesionales y especialistas al servicio de la sociedad",
        en: "Professionals and specialists serving society",
        fr: "Des professionnels et spécialistes au service de la société"
    },
    ".team-teaser-section p": {
        es: "Contamos con un grupo interdisciplinario de directivos, docentes investigadores y gestores de proyectos altamente capacitados en el ámbito sociojurídico, litigio, consultoría y políticas públicas.",
        en: "We have an interdisciplinary group of leaders, faculty researchers, and project managers highly skilled in socio-legal practice, litigation, consultancy, and public policy.",
        fr: "Nous disposons d'un groupe pluridisciplinaire de directeurs, d'enseignants-chercheurs et de gestionnaires de projets hautement qualifiés dans le domaine socio-juridique et les politiques publiques."
    },
    ".team-teaser-section .btn-outline-custom": {
        es: "Conocer al equipo",
        en: "Meet the team",
        fr: "Rencontrer l'équipe"
    },

    // CTA (HOME & PROYECTOS)
    ".home-cta-content h2": {
        es: "Potencie sus iniciativas jurídicas e institucionales",
        en: "Empower your legal and institutional initiatives",
        fr: "Renforcez vos initiatives juridiques et institutionnelles"
    },
    ".home-cta-content p": {
        es: "Si su organización o entidad requiere asesoría técnica, consultoría sociojurídica o acompañamiento en proyectos estratégicos, contáctese con nuestro equipo de especialistas.",
        en: "If your organization or entity requires technical advice, socio-legal consulting, or guidance on strategic projects, contact our team of specialists.",
        fr: "Si votre organisation nécessite des conseils techniques, une assistance socio-juridique ou un accompagnement sur des projets stratégiques, contactez notre équipe."
    },
    ".home-cta-content .btn": {
        es: "Solicitar Asesoría",
        en: "Request Advisory",
        fr: "Demander Conseil"
    },

    // SUBPAGE HERO HEADINGS
    "#view-sobre-nosotros .subpage-hero h1": {
        es: "Sobre Nosotros",
        en: "About Us",
        fr: "À Propos de Nous"
    },
    "#view-portafolio .subpage-hero h1": {
        es: "Servicios y Portafolio",
        en: "Services & Portfolio",
        fr: "Services et Portfolio"
    },
    "#view-proyectos .subpage-hero h1": {
        es: "Proyectos Destacados",
        en: "Featured Projects",
        fr: "Projets Phares"
    },
    "#view-lineas-investigacion .subpage-hero h1": {
        es: "Líneas de Investigación",
        en: "Lines of Research",
        fr: "Lignes de Recherche"
    },
    "#view-equipo .subpage-hero h1": {
        es: "Nuestro Equipo",
        en: "Our Team",
        fr: "Notre Équipe"
    },
    "#view-contacto .subpage-hero h1": {
        es: "Contacto",
        en: "Contact",
        fr: "Contact"
    },

    // SUBPAGE INTROS
    "#view-lineas-investigacion .subpage-section-title h2": {
        es: "¿Qué áreas de investigación lideramos?",
        en: "What areas of research do we lead?",
        fr: "Quels domaines de recherche menons-nous ?"
    },
    "#view-lineas-investigacion .subpage-section-title p": {
        es: "El Centro de Investigaciones SocioJurídicas y Políticas (CISyP) del Departamento de Derecho y Ciencias Políticas lidera campos de indagación científica orientados a la producción académica de alto impacto, la transformación social y el fortalecimiento del Estado Social de Derecho.",
        en: "The Socio-Legal and Political Research Center (CISyP) of the Department of Law and Political Science leads fields of inquiry oriented towards high-impact academic output, social transformation, and the rule of law.",
        fr: "Le Centre de Recherches Socio-Juridiques et Politiques (CISyP) mène des champs de recherche orientés vers une production académique à fort impact et la transformation sociale."
    },
    "#view-equipo .subpage-section-title h2": {
        es: "¿Quiénes integran el grupo de profesionales?",
        en: "Who are the professionals in our team?",
        fr: "Qui sont les professionnels de notre équipe ?"
    },
    "#view-equipo .subpage-section-title p": {
        es: "Conozca al equipo directivo, docente e investigador del CISyP, un grupo multidisciplinario comprometido con la excelencia académica, el rigor científico y el impacto social.",
        en: "Meet the executive, teaching, and research team of CISyP, an interdisciplinary group committed to academic excellence, scientific rigor, and social impact.",
        fr: "Rencontrez l'équipe de direction, d'enseignement et de recherche du CISyP, un groupe pluridisciplinaire engagé pour l'excellence et l'impact social."
    },
    "#view-contacto .subpage-section-title h2": {
        es: "¿Cómo podemos ayudarte a potenciar tus iniciativas?",
        en: "How can we help you empower your initiatives?",
        fr: "Comment pouvons-nous vous aider à développer vos initiatives ?"
    },
    "#view-contacto .subpage-section-title p": {
        es: "Póngase en contacto con nuestro equipo para recibir asesoría personalizada, coordinar visitas del consultorio o establecer alianzas estratégicas universitarias.",
        en: "Get in touch with our team to receive personalized advice, coordinate legal clinic visits, or establish university strategic partnerships.",
        fr: "Contactez notre équipe pour recevoir des conseils personnalisés, coordonner des interventions ou établir des partenariats stratégiques universitaires."
    },

    // CONTACT FORM
    "#view-contacto .form-card h3": {
        es: "Formulario de solicitud de asesoría",
        en: "Advisory Request Form",
        fr: "Formulaire de demande de conseil"
    },
    "label[for='cont-name']": {
        es: "Nombre o Razón Social *",
        en: "Full Name or Organization *",
        fr: "Nom complet ou Organisation *"
    },
    "label[for='cont-email']": {
        es: "Correo Electrónico *",
        en: "Email Address *",
        fr: "Adresse e-mail *"
    },
    "label[for='cont-message']": {
        es: "Detalle su requerimiento o consulta *",
        en: "Detail your request or inquiry *",
        fr: "Détaillez votre demande ou question *"
    },
    "#contacto-form button[type='submit']": {
        es: "Enviar mensaje de asesoría",
        en: "Send advisory request",
        fr: "Envoyer la demande de conseil"
    },

    // RESEARCH LINES (LÍNEAS DE INVESTIGACIÓN)
    ".research-item:nth-child(1) h3": {
        es: "Gobernanza, políticas públicas y desarrollo sostenible",
        en: "Governance, public policy, and sustainable development",
        fr: "Gouvernance, politiques publiques et développement durable"
    },
    ".research-item:nth-child(1) p": {
        es: "Orientada al estudio de los procesos de formulación, implementación y evaluación de políticas públicas, la gobernanza territorial, la participación ciudadana, la gestión pública y los mecanismos de fortalecimiento institucional para el desarrollo sostenible.",
        en: "Aimed at the study of the formulation, implementation, and evaluation processes of public policies, territorial governance, citizen participation, public management, and institutional strengthening mechanisms for sustainable development.",
        fr: "Visant l'étude des processus de formulation, mise en œuvre et évaluation des politiques publiques, la gouvernance territoriale, la gestion publique et le renforcement institutionnel pour le développement durable."
    },
    ".research-item:nth-child(2) h3": {
        es: "Justicia, derechos humanos y transformación social",
        en: "Justice, human rights, and social transformation",
        fr: "Justice, droits de l'homme et transformation sociale"
    },
    ".research-item:nth-child(2) p": {
        es: "Dirigida al análisis de los sistemas de protección de derechos humanos, acceso a la justicia, grupos vulnerables, construcción de ciudadanía, cultura de paz, inclusión social y fortalecimiento del Estado Social de Derecho.",
        en: "Focused on the analysis of human rights protection systems, access to justice, vulnerable groups, citizenship building, peace culture, social inclusion, and strengthening the rule of law.",
        fr: "Axée sur l'analyse des systèmes de protection des droits humains, l'accès à la justice, les groupes vulnérables, la culture de la paix et l'inclusion sociale."
    },
    ".research-item:nth-child(3) h3": {
        es: "Derecho, empresa e innovación organizacional",
        en: "Law, enterprise, and organizational innovation",
        fr: "Droit, entreprise et innovation organisationnelle"
    },
    ".research-item:nth-child(3) p": {
        es: "Orientada al estudio de los fenómenos jurídicos asociados al desarrollo empresarial, la competitividad, el derecho corporativo, la responsabilidad social, la sostenibilidad organizacional y la regulación económica.",
        en: "Oriented toward the study of legal phenomena associated with business development, competitiveness, corporate law, social responsibility, organizational sustainability, and economic regulation.",
        fr: "Orientée vers l'étude des phénomènes juridiques associés au développement des entreprises, à la compétitivité, au droit des sociétés et à la régulation économique."
    },
    ".research-item:nth-child(4) h3": {
        es: "Transformación digital, inteligencia artificial y regulación tecnológica",
        en: "Digital transformation, artificial intelligence, and technological regulation",
        fr: "Transformation numérique, intelligence artificielle et régulation technologique"
    },
    ".research-item:nth-child(4) p": {
        es: "Enfocada en el análisis jurídico y político de las tecnologías emergentes, inteligencia artificial, protección de datos, gobierno digital, ciberseguridad, evidencia digital, innovación pública y transformación digital.",
        en: "Focused on the legal and political analysis of emerging technologies, artificial intelligence, data protection, digital government, cybersecurity, digital evidence, and public innovation.",
        fr: "Centrée sur l'analyse juridique et politique des technologies émergentes, de l'intelligence artificielle, de la protection des données, de la cybersécurité et de l'innovation publique."
    },
    ".research-item:nth-child(5) h3": {
        es: "Educación, cultura jurídica y apropiación social del conocimiento",
        en: "Education, legal culture, and social appropriation of knowledge",
        fr: "Éducation, culture juridique et appropriation sociale du savoir"
    },
    ".research-item:nth-child(5) p": {
        es: "Orientada al estudio de los procesos educativos, innovación pedagógica, formación jurídica, cultura ciudadana, alfabetización legal y estrategias de apropiación social del conocimiento.",
        en: "Aimed at the study of educational processes, pedagogical innovation, legal training, civic culture, legal literacy, and strategies for the social appropriation of knowledge.",
        fr: "Visant l'étude des processus éducatifs, de l'innovation pédagogique, de la formation juridique, de la culture citoyenne et de l'appropriation sociale du savoir."
    },
    ".research-item:nth-child(6) h3": {
        es: "Territorio, ambiente y desarrollo humano sostenible",
        en: "Territory, environment, and sustainable human development",
        fr: "Territoire, environnement et développement humain durable"
    },
    ".research-item:nth-child(6) p": {
        es: "Dirigida al estudio de los conflictos socioambientales, justicia ambiental, ordenamiento territorial, sostenibilidad, cambio climático, gestión del riesgo y protección de recursos naturales desde una perspectiva jurídica y política.",
        en: "Directed toward the study of socio-environmental conflicts, environmental justice, spatial planning, sustainability, climate change, risk management, and natural resource protection.",
        fr: "Destinée à l'étude des conflits socio-environnementaux, de la justice environnementale, de l'aménagement du territoire, de la durabilité et de la protection des ressources naturelles."
    },

    // FOOTER
    ".footer-col:nth-child(2) h4": {
        es: "Mapa del sitio",
        en: "Site Map",
        fr: "Plan du site"
    },
    ".footer-col:nth-child(3) h4": {
        es: "Redes y Contacto",
        en: "Social Media & Contact",
        fr: "Réseaux & Contact"
    },
    ".footer-links a[href='#lineas-investigacion']": {
        es: "Investigación",
        en: "Research",
        fr: "Recherche"
    },
    ".footer-links a[href='#equipo']": {
        es: "Equipo",
        en: "Team",
        fr: "Équipe"
    }
};

function updateElement(selector, lang) {
    const elements = document.querySelectorAll(selector);
    if (!elements || elements.length === 0 || !translationMap[selector] || !translationMap[selector][lang]) return;
    elements.forEach(el => {
        el.textContent = translationMap[selector][lang];
    });
}

function translatePage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    
    Object.keys(translationMap).forEach(selector => {
        updateElement(selector, lang);
    });

    if (typeof window.updateTeamCarouselText === 'function') {
        window.updateTeamCarouselText();
    }
}

function initLanguageSelector() {
    const langSelector = document.querySelector('.lang-selector');
    const langBtn = document.querySelector('.lang-btn');
    const langDropdown = document.querySelector('.lang-dropdown');
    const langOptions = document.querySelectorAll('.lang-dropdown button');
    
    if (!langBtn || !langDropdown) return;
    
    langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = langDropdown.classList.toggle('open');
        if (langSelector) langSelector.classList.toggle('open', isOpen);
        langBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    
    document.addEventListener('click', (e) => {
        if (langSelector && !langSelector.contains(e.target)) {
            langDropdown.classList.remove('open');
            langSelector.classList.remove('open');
            langBtn.setAttribute('aria-expanded', 'false');
        }
    });
    
    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = option.getAttribute('data-lang');
            
            langOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const flagSrc = option.querySelector('img').getAttribute('src');
            langBtn.querySelector('img').setAttribute('src', flagSrc);
            langBtn.querySelector('span').textContent = lang.toUpperCase();
            
            langDropdown.classList.remove('open');
            if (langSelector) langSelector.classList.remove('open');
            langBtn.setAttribute('aria-expanded', 'false');
            
            translatePage(lang);
        });
    });
}

/*
========================================================================
   6. GESTIÓN DE FORMULARIOS DE CONTACTO
========================================================================
*/
function initFormHandlers() {
    const form = document.getElementById('contacto-form');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const feedback = form.querySelector('.form-feedback');
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        const lang = currentLanguage || 'es';
        const trans = formTranslations[lang] || formTranslations.es;
        
        submitBtn.disabled = true;
        submitBtn.textContent = trans.sending;
        
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            
            if (feedback) {
                feedback.innerHTML = `<strong>${trans.successTitle}</strong><br>${trans.successBody}`;
                feedback.className = 'form-feedback success';
                feedback.style.display = 'block';
            }
            
            form.reset();
            
            setTimeout(() => {
                if (feedback) feedback.style.display = 'none';
            }, 6000);
        }, 1200);
    });
}

/*
========================================================================
   7. MARQUEE INFINITO DE ALIANZAS
========================================================================
*/
function initLogoLoop() {
    const marqueeContent = document.querySelector('.marquee-content');
    if (!marqueeContent) return;
    
    // Duplicar elementos para un scroll continuo infinito
    const clone = marqueeContent.cloneNode(true);
    marqueeContent.parentNode.appendChild(clone);
}

/*
========================================================================
   8. SECUENCIA DE SCROLL DE SERVICIOS (STACKING HORIZONTAL)
========================================================================
*/
function initServicesSequence() {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector("#view-portafolio .horizontal-section");
    if (!section) return;
    const wrapper = section.querySelector(".wrapper");
    const items = wrapper.querySelectorAll(".item");

    items.forEach((item, index) => {
        if (index !== 0) {
            gsap.set(item, { xPercent: 100 });
        }
    });

    const stackTl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            pin: true,
            start: "top 90px",
            end: () => "+=" + ((items.length - 1) * 100) + "%",
            scrub: 1,
            invalidateOnRefresh: true,
        },
        defaults: { ease: "none" },
    });

    items.forEach((item, index) => {
        if (index < items.length - 1) {
            const innerContainer = item.querySelector('.item-inner-container');
            if (innerContainer) {
                stackTl.to(innerContainer, {
                    scale: 0.92, 
                    duration: 1
                });
            }

            stackTl.to(items[index + 1], {
                xPercent: 0,
                duration: 1
            }, "<");
        }
    });

    gsap.from("#view-portafolio .flipbook-section", {
        opacity: 0,
        y: 50,
        duration: 0.8,
        scrollTrigger: {
            trigger: "#view-portafolio .flipbook-section",
            start: "top 90%",
            toggleActions: "play none none reverse"
        }
    });
}

/*
========================================================================
   9. SECUENCIA DE SCROLL DE PROYECTOS (STACKING VERTICAL)
========================================================================
*/
function initProjectsSequence() {
    if (!window.gsap || !window.ScrollTrigger) return;
    
    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector("#view-proyectos .vertical-projects-section");
    if (!section) return;
    const wrapper = section.querySelector(".projects-wrapper");
    const items = wrapper.querySelectorAll(".project-item");

    let mm = gsap.matchMedia();

    mm.add("(min-width: 961px)", () => {
        items.forEach((item, index) => {
            if (index !== 0) {
                gsap.set(item, { yPercent: 100 });
            } else {
                gsap.set(item, { yPercent: 0 });
            }
        });

        const stackTl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                pin: true,
                start: "top 80px",
                end: () => "+=" + ((items.length - 1) * 120) + "%",
                scrub: 1,
                invalidateOnRefresh: true,
            },
            defaults: { ease: "none" },
        });

        // Suave pausa inicial para fijar la primera tarjeta sin ningún salto brusco
        stackTl.to({}, { duration: 0.25 });

        items.forEach((item, index) => {
            if (index < items.length - 1) {
                const innerCard = item.querySelector('.project-case-card');
                if (innerCard) {
                    stackTl.to(innerCard, {
                        scale: 0.94,
                        duration: 1
                    });
                }

                stackTl.to(items[index + 1], {
                    yPercent: 0,
                    duration: 1
                }, "<");
            }
        });

        // Pausa final para transición fluida de salida
        stackTl.to({}, { duration: 0.35 });
    });

    gsap.from("#view-proyectos .home-cta-section", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        scrollTrigger: {
            trigger: "#view-proyectos .home-cta-section",
            start: "top 90%",
            toggleActions: "play none none reverse"
        }
    });
}

/*
========================================================================
   10. FLIPBOOK 3D INTERACTIVO
========================================================================
*/
function initFlipbook() {
    const prevBtn = document.getElementById('fb-prev-btn');
    const nextBtn = document.getElementById('fb-next-btn');
    const book = document.querySelector('.flipbook-container .book');
    if (!prevBtn || !nextBtn || !book) return;
    
    const papers = Array.from(book.querySelectorAll('.paper'));
    if (papers.length === 0) return;

    let currentLocation = 1;
    const numOfPapers = papers.length;
    const maxLocation = numOfPapers + 1;

    const openBook = () => {
        book.style.transform = "translateX(0%)";
    };

    const closeBook = (isAtBeginning) => {
        if (isAtBeginning) {
            book.style.transform = "translateX(-25%)";
        } else {
            book.style.transform = "translateX(25%)";
        }
    };

    const updateBookState = () => {
        papers.forEach((paper, i) => {
            const paperIndex = i + 1;
            if (paperIndex < currentLocation) {
                paper.classList.add('flipped');
                paper.style.zIndex = paperIndex;
            } else {
                paper.classList.remove('flipped');
                paper.style.zIndex = numOfPapers - paperIndex + 1;
            }
        });

        if (currentLocation === 1) {
            closeBook(true);
        } else if (currentLocation === maxLocation) {
            closeBook(false);
        } else {
            openBook();
        }
    };

    const goNextPage = () => {
        if (currentLocation < maxLocation) {
            currentLocation++;
            updateBookState();
        }
    };

    const goPrevPage = () => {
        if (currentLocation > 1) {
            currentLocation--;
            updateBookState();
        }
    };

    // Reemplazar listeners para evitar duplicados
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goPrevPage();
    });
    
    newNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        goNextPage();
    });

    papers.forEach((paper, i) => {
        const paperIndex = i + 1;
        paper.onclick = (e) => {
            e.stopPropagation();
            if (currentLocation === paperIndex) {
                goNextPage();
            } else if (currentLocation === paperIndex + 1) {
                goPrevPage();
            }
        };
    });

    updateBookState();
}

/*
========================================================================
   11. CAROUSEL 3D DE EQUIPO
========================================================================
*/
function initTeamCarousel() {
    const carouselContainer = document.querySelector('#view-equipo .carousel-container');
    if (!carouselContainer) return;

    const cards = carouselContainer.querySelectorAll(".team-card");
    const dots = document.querySelectorAll("#view-equipo .team-dots .dot");
    const memberName = document.querySelector("#view-equipo .member-name");
    const memberRole = document.querySelector("#view-equipo .member-role");
    const prevBtn = document.getElementById("team-prev-btn");
    const nextBtn = document.getElementById("team-next-btn");

    const memberEmail = document.querySelector("#view-equipo .member-email");

    if (cards.length === 0) return;

    let currentIndex = 0;
    let isAnimating = false;

    function updateTeamCarouselText() {
        if (cards.length === 0 || !memberName || !memberRole) return;
        const activeCard = cards[currentIndex];
        const lang = currentLanguage || 'es';
        const name = activeCard.getAttribute(`data-name-${lang}`) || activeCard.getAttribute('data-name-es') || '';
        const role = activeCard.getAttribute(`data-role-${lang}`) || activeCard.getAttribute('data-role-es') || '';
        const email = activeCard.getAttribute('data-email') || '';
        
        memberName.textContent = name;
        memberRole.textContent = role;

        if (memberEmail) {
            if (email) {
                memberEmail.innerHTML = `<a href="mailto:${email}" class="team-email-link"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>${email}</a>`;
                memberEmail.style.display = 'block';
            } else {
                memberEmail.style.display = 'none';
            }
        }
    }

    window.updateTeamCarouselText = () => {
        updateTeamCarouselText();
    };

    function updateCarousel(newIndex, force = false) {
        if (isAnimating && !force) return;
        isAnimating = true;

        currentIndex = (newIndex + cards.length) % cards.length;

        const isMobile = window.innerWidth <= 768;
        const xGap1 = isMobile ? 120 : 220;
        const xGap2 = isMobile ? 220 : 400;

        cards.forEach((card, i) => {
            let offset = i - currentIndex;
            if (offset > Math.floor(cards.length / 2)) offset -= cards.length;
            if (offset < -Math.floor(cards.length / 2)) offset += cards.length;

            let x = 0, z = 0, scale = 1, opacity = 1, grayscale = 100;
            let zIndex = 10 - Math.abs(offset);

            if (offset === 0) {
                scale = 1.1;
                grayscale = 0;
                card.classList.add('active-card');
            } else if (Math.abs(offset) === 1) {
                x = offset * xGap1;
                z = -120;
                scale = 0.85;
                opacity = 0.75;
                card.classList.remove('active-card');
            } else if (Math.abs(offset) === 2) {
                x = offset > 0 ? xGap2 : -xGap2;
                z = -240;
                scale = 0.65;
                opacity = 0.45;
                card.classList.remove('active-card');
            } else {
                x = offset > 0 ? 550 : -550;
                z = -350;
                scale = 0.4;
                opacity = 0;
                card.classList.remove('active-card');
            }

            if (window.gsap) {
                gsap.to(card, {
                    x: x,
                    z: z,
                    scale: scale,
                    opacity: opacity,
                    filter: `grayscale(${grayscale}%)`,
                    duration: 0.6,
                    ease: 'power2.out',
                    onComplete: () => {
                        isAnimating = false;
                    }
                });
            } else {
                isAnimating = false;
            }
            card.style.zIndex = zIndex;
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });

        updateTeamCarouselText();
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            updateCarousel(currentIndex - 1);
        });

        nextBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            updateCarousel(currentIndex + 1);
        });
    }

    cards.forEach((card, index) => {
        card.addEventListener("click", (e) => {
            e.stopPropagation();
            if (currentIndex !== index) {
                updateCarousel(index);
            }
        });
    });

    dots.forEach((dot, index) => {
        dot.addEventListener("click", (e) => {
            e.stopPropagation();
            updateCarousel(index);
        });
    });

    // Touch swipe support
    let touchStartX = 0;
    carouselContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselContainer.addEventListener('touchend', (e) => {
        let touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            updateCarousel(currentIndex + 1);
        } else if (touchEndX - touchStartX > 50) {
            updateCarousel(currentIndex - 1);
        }
    }, { passive: true });

    updateCarousel(0, true);
}
