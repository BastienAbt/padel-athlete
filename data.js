
const APP_DATA = {
  workouts: [
    {
      id:"A", name:"Force + puissance jambes", duration:"55–65 min", location:"Salle",
      tags:["Padel","Force","Prévention"],
      exercises:[
        ["box-jump","3 × 5","Repos 75–90 s — qualité maximale"],
        ["leg-press","4 × 6–8","RPE 7–8"],
        ["rdl","3 × 8","Contrôle 3 s en descente"],
        ["bulgarian-split","3 × 8 / jambe","Amplitude confortable"],
        ["calf-straight","3 × 12–15","Charge progressive"],
        ["calf-bent","3 × 12–15","Soléaire"],
        ["pallof","3 × 10 / côté","2 s de maintien"],
        ["pullup","3 séries","Progression calisthénie"]
      ]
    },
    {
      id:"B", name:"Haut du corps + athlétisation", duration:"55–65 min", location:"Salle",
      tags:["Calisthénie","Épaule","Coude"],
      exercises:[
        ["handstand-wall","4 × 20–30 s","Skill en début de séance"],
        ["dead-hang","3 séries","Base grip / suspension"],
        ["assisted-pullup","3 × 5–8","Progression traction"],
        ["support-hold","3 × 15–25 s","Base avant dips"],
        ["row","3 × 8–12","Tirage horizontal"],
        ["pushup","3 × 8–15","Progression technique"],
        ["woodchop","3 × 10 / côté","Rotation contrôlée"],
        ["facepull","2 × 15","Scapula"],
        ["wrist-ext","3 × 12–15","Extenseurs du poignet"],
        ["pronation","2 × 12 / côté","Contrôle lent"],
        ["farmer","3 × 30–40 m","Grip + tronc"]
      ]
    },
    {
      id:"C", name:"Maison — skills + mobilité + appuis", duration:"40–50 min", location:"Maison",
      tags:["Calisthénie","Agilité","Mobilité"],
      exercises:[
        ["splitstep","5 × 45 s","Réaction + reprise d'appuis"],
        ["skater","3 × 8 / côté","Atterrissage stable"],
        ["reaction","6 × 30 s","Signal aléatoire"],
        ["lsit","5 × 10–20 s","Progression calisthénie"],
        ["pistol","3 × 5 / côté","Progression assistée"],
        ["deadbug","3 × 8 / côté","Contrôle lombo-pelvien"],
        ["shortfoot","2 × 10","Pied"],
        ["anklemob","2 × 60 s / côté","Dorsiflexion"],
        ["thoracic","2 × 8 / côté","Rotation thoracique"]
      ]
    },
    {
      id:"R", name:"Activation pré-tournoi", duration:"20–25 min", location:"Maison / salle",
      tags:["Récupération","Tournoi"],
      exercises:[
        ["anklemob","2 × 45 s / côté","Sans forcer"],
        ["splitstep","4 × 30 s","Rapide, non fatigant"],
        ["band-external","2 × 12","Épaule"],
        ["calf-straight","2 × 10","Charge légère"],
        ["deadbug","2 × 6 / côté","Contrôle"]
      ]
    }
  ],
  exercises:[
    {id:"box-jump",name:"Box jump",cat:"Puissance",goal:"Développer la puissance des membres inférieurs.",how:"Partir debout, légère flexion de hanches et de genoux, puis sauter de façon explosive sur une box. Atterrir silencieusement, genoux alignés avec les pieds. Descendre en marchant.",cues:["Chercher la vitesse, pas la fatigue","Arrêter la série si la hauteur ou la qualité baisse","Ne pas sauter d'une box trop haute"],errors:["Genoux qui rentrent vers l'intérieur","Enchaîner les répétitions sans récupération","Redescendre en sautant inutilement"]},
    {id:"leg-press",name:"Presse à cuisses",cat:"Force",goal:"Construire une base de force des membres inférieurs.",how:"Pieds environ largeur d'épaules. Descendre le plateau jusqu'à une amplitude où le bassin reste stable, puis pousser avec le pied entier.",cues:["Genoux dans l'axe des orteils","Garder le bassin au contact","2 répétitions en réserve"],errors:["Décoller le bassin","Verrouillage brutal des genoux"]},
    {id:"rdl",name:"Soulevé de terre roumain",cat:"Force",goal:"Ischio-jambiers, fessiers et contrôle de hanche.",how:"Haltères ou barre près des jambes. Reculer les hanches avec une légère flexion des genoux, dos neutre, puis revenir en contractant les fessiers.",cues:["Hanches vers l'arrière","Charge proche des jambes","Sentir les ischio-jambiers"],errors:["Arrondir le dos","Transformer le mouvement en squat"]},
    {id:"bulgarian-split",name:"Fente bulgare",cat:"Force",goal:"Force unilatérale et stabilité.",how:"Pied arrière sur un banc bas, pied avant stable. Descendre verticalement puis pousser dans le sol.",cues:["Bassin face à l'avant","Genou dans l'axe","Contrôler la descente"],errors:["Perdre l'équilibre par charge excessive","Genou qui s'effondre vers l'intérieur"]},
    {id:"calf-straight",name:"Mollets jambe tendue",cat:"Prévention",goal:"Renforcer surtout le gastrocnémien et améliorer la tolérance aux impacts.",how:"Monter haut sur la pointe du pied, pause brève, redescendre lentement jusqu'à l'étirement.",cues:["Amplitude complète","Progression de charge","Mouvement contrôlé"],errors:["Rebondir","Amplitude partielle"]},
    {id:"calf-bent",name:"Mollets genou fléchi",cat:"Prévention",goal:"Renforcer le soléaire, important pour les appuis répétés.",how:"Même principe que le calf raise avec genou fléchi ou sur machine seated calf raise.",cues:["Garder le genou fléchi","Descente lente"],errors:["Charge trop lourde","Perdre l'amplitude"]},
    {id:"pallof",name:"Pallof press",cat:"Tronc",goal:"Anti-rotation du tronc.",how:"Debout de profil à une poulie ou un élastique. Amener les mains devant le sternum puis tendre les bras sans laisser le tronc tourner.",cues:["Côtes basses","Bassin stable","Expirer en tendant"],errors:["Tourner avec la résistance","Cambrer"]},
    {id:"dead-hang",name:"Suspension passive",cat:"Calisthénie",goal:"Construire le grip et la tolérance des épaules à la suspension.",how:"Suspendu à la barre, bras tendus, corps relâché mais contrôlé. Garder une respiration calme et arrêter avant perte du grip.",cues:["Pouces autour de la barre","Pas de balancement","Respiration régulière"],errors:["Tenir jusqu'à l'échec complet","Douleur d'épaule ignorée"]},
    {id:"active-hang",name:"Suspension active",cat:"Calisthénie",goal:"Apprendre le contrôle scapulaire avant la traction.",how:"Depuis une suspension bras tendus, abaisser légèrement les épaules sans fléchir les coudes, puis revenir lentement.",cues:["Bras restent tendus","Petit mouvement","Cou long"],errors:["Plier les coudes","Hausser les épaules"]},
    {id:"scap-pullup",name:"Traction scapulaire",cat:"Calisthénie",goal:"Renforcer l'initiation scapulaire de la traction.",how:"Depuis une suspension, abaisser les omoplates et remonter légèrement le corps sans plier les coudes.",cues:["Mouvement court","Coudes verrouillés","Contrôle"],errors:["Transformer en traction","Balancer"]},
    {id:"negative-pullup",name:"Traction négative",cat:"Calisthénie",goal:"Construire la force spécifique de traction par travail excentrique.",how:"Commencer menton au-dessus de la barre avec un support, puis descendre lentement en 3 à 8 secondes jusqu'à bras tendus.",cues:["Descente uniforme","Épaules contrôlées","Arrêter avant perte de contrôle"],errors:["Chute rapide","Trop de répétitions jusqu'à l'échec"]},
    {id:"assisted-pullup",name:"Traction assistée",cat:"Calisthénie",goal:"Apprendre le geste complet avec assistance.",how:"Utiliser un élastique ou une machine assistée. Réaliser une traction complète avec contrôle de la montée et de la descente.",cues:["Amplitude complète","Pas d'élan","Initier par les omoplates"],errors:["Assistance trop faible","Kipping"]},
    {id:"pullup",name:"Traction",cat:"Calisthénie",goal:"Force relative, dos, grip et contrôle scapulaire.",how:"Suspendu à la barre, initier par les omoplates puis tirer jusqu'à amener le haut de poitrine vers la barre. Redescendre sous contrôle.",cues:["Corps gainé","Épaules loin des oreilles","Amplitude contrôlée"],errors:["Balancer les jambes","Demi-répétitions","Hausser les épaules"]},
    {id:"handstand-wall",name:"Handstand au mur",cat:"Calisthénie",goal:"Contrôle corporel, stabilité scapulaire et apprentissage de l'équilibre inversé.",how:"Monter progressivement contre un mur, mains largeur d'épaules, pousser activement le sol et maintenir le corps gainé.",cues:["Bras tendus","Pousser le sol","Regard entre les mains"],errors:["Cambrure excessive","Épaules passives"]},
    {id:"dip",name:"Dips",cat:"Calisthénie",goal:"Force de poussée du haut du corps.",how:"Sur barres parallèles, descendre de manière contrôlée jusqu'à une amplitude confortable puis repousser.",cues:["Omoplates contrôlées","Amplitude sans douleur","Pas d'à-coup"],errors:["Descendre trop bas malgré une gêne antérieure d'épaule","Épaules qui remontent"]},
    {id:"row",name:"Rowing horizontal",cat:"Force",goal:"Renforcer le dos et les stabilisateurs de l'omoplate.",how:"Tirer la poignée vers les côtes en gardant le tronc stable.",cues:["Coude vers l'arrière","Poitrine ouverte"],errors:["Élan du buste","Épaules vers les oreilles"]},
    {id:"incline-pushup",name:"Pompes inclinées",cat:"Calisthénie",goal:"Construire une poussée propre avant les pompes au sol.",how:"Mains sur un support stable, corps gainé. Descendre la poitrine vers le support puis repousser.",cues:["Corps aligné","Amplitude contrôlée","Coudes 30–45°"],errors:["Bassin qui tombe","Amplitude partielle"]},
    {id:"support-hold",name:"Support hold",cat:"Calisthénie",goal:"Construire la stabilité des épaules avant les dips.",how:"Bras tendus sur barres parallèles, maintenir le corps stable avec les épaules basses.",cues:["Bras verrouillés","Épaules basses","Gainage"],errors:["Épaules vers les oreilles","Douleur antérieure d'épaule"]},
    {id:"pushup",name:"Pompes",cat:"Calisthénie",goal:"Force de poussée, gainage et contrôle scapulaire.",how:"Corps aligné de la tête aux talons. Descendre poitrine vers le sol puis repousser sans casser la ligne du tronc.",cues:["Gainage actif","Coudes environ 30–45°","Amplitude complète"],errors:["Bassin qui tombe","Coudes très ouverts"]},
    {id:"woodchop",name:"Woodchopper à la poulie",cat:"Tronc",goal:"Contrôle et production de force en rotation.",how:"Déplacer la poignée en diagonale en initiant le mouvement par le tronc et les hanches, sans tirer uniquement avec les bras.",cues:["Pieds stables","Rotation contrôlée","Revenir lentement"],errors:["Mouvement uniquement des bras","Lombaires en hyperextension"]},
    {id:"facepull",name:"Face pull",cat:"Prévention",goal:"Renforcer la chaîne postérieure de l'épaule et le contrôle scapulaire.",how:"Tirer la corde vers le visage, coudes ouverts, finir avec une rotation externe légère.",cues:["Omoplates contrôlées","Charge modérée"],errors:["Tirer trop lourd","Cambrer"]},
    {id:"wrist-ext",name:"Extension du poignet",cat:"Prévention",goal:"Renforcement progressif des extenseurs du poignet.",how:"Avant-bras soutenu, paume vers le bas. Monter le poignet puis redescendre lentement sur environ 3 secondes.",cues:["Charge légère au départ","Descente lente","Douleur faible ou absente"],errors:["Charge excessive","Mouvement rapide"]},
    {id:"pronation",name:"Pronation / supination",cat:"Prévention",goal:"Renforcer les muscles rotateurs de l'avant-bras.",how:"Coude à 90°, tenir un marteau ou haltère léger et tourner lentement la paume vers le haut puis vers le bas.",cues:["Coude immobile","Contrôle"],errors:["Bouger l'épaule","Amplitude forcée"]},
    {id:"farmer",name:"Farmer carry",cat:"Force",goal:"Grip, gainage et stabilité d'épaule.",how:"Marcher avec des haltères lourds en gardant le corps droit.",cues:["Grandir","Épaules stables","Pas réguliers"],errors:["Se pencher","Charge impossible à contrôler"]},
    {id:"splitstep",name:"Split-step + départ",cat:"Agilité",goal:"Améliorer la disponibilité des appuis avant la frappe adverse.",how:"Petit saut d'allègement puis réception sur l'avant-pied. À la réception, partir immédiatement vers la direction indiquée.",cues:["Réception au moment du signal","Petit saut, pas un saut vertical haut","Premier pas explosif"],errors:["Saut trop haut","Attendre après la réception"]},
    {id:"skater",name:"Skater jump",cat:"Puissance",goal:"Puissance latérale et contrôle de l'atterrissage.",how:"Sauter latéralement d'une jambe sur l'autre et stabiliser brièvement l'atterrissage.",cues:["Atterrissage silencieux","Genou aligné","Distance progressive"],errors:["Genou en valgus","Chercher trop loin trop tôt"]},
    {id:"reaction",name:"Réaction sur signal",cat:"Agilité",goal:"Coupler perception, décision et premier déplacement.",how:"Utiliser un minuteur aléatoire, un partenaire ou une application de signaux. À chaque signal, effectuer un petit déplacement prédéfini dans une direction aléatoire.",cues:["Position d'attente basse","Réponse courte et rapide","Priorité à la précision"],errors:["Transformer en cardio continu","Anticiper un rythme régulier"]},
    {id:"lsit",name:"L-sit",cat:"Calisthénie",goal:"Gainage, compression de hanche et force des épaules.",how:"Sur parallettes ou deux supports stables, bras tendus, décoller le bassin puis progressivement les pieds.",cues:["Épaules basses","Bras verrouillés","Commencer genoux fléchis"],errors:["Retenir sa respiration","Forcer une version trop avancée"]},
    {id:"pistol",name:"Pistol squat assisté",cat:"Calisthénie",goal:"Force unilatérale, mobilité et équilibre.",how:"S'accroupir sur une jambe avec une assistance (poteau, sangle ou banc) puis remonter.",cues:["Utiliser l'assistance nécessaire","Genou dans l'axe","Progression lente"],errors:["Chercher la profondeur au détriment du contrôle","Valgus du genou"]},
    {id:"deadbug",name:"Dead bug",cat:"Tronc",goal:"Contrôle lombo-pelvien et anti-extension.",how:"Dos au sol, hanches et genoux à 90°. Étendre lentement bras et jambe opposés sans laisser les lombaires se creuser.",cues:["Expirer","Côtes basses","Lent"],errors:["Cambrer","Aller trop vite"]},
    {id:"shortfoot",name:"Short foot",cat:"Prévention",goal:"Renforcer les muscles intrinsèques du pied.",how:"Sans crisper les orteils, rapprocher légèrement la tête du premier métatarsien du talon afin de créer une arche active.",cues:["Orteils détendus","Contraction légère"],errors:["Griffer le sol avec les orteils"]},
    {id:"anklemob",name:"Mobilité cheville au mur",cat:"Mobilité",goal:"Entretenir/améliorer la dorsiflexion.",how:"Pied à plat face à un mur, amener le genou vers le mur sans décoller le talon.",cues:["Talon au sol","Genou dans l'axe"],errors:["Pied qui s'effondre","Forcer une douleur"]},
    {id:"thoracic",name:"Rotation thoracique",cat:"Mobilité",goal:"Améliorer la rotation du haut du tronc.",how:"À quatre pattes ou en position chevalier servant, effectuer des rotations contrôlées du thorax.",cues:["Bassin stable","Respiration lente"],errors:["Compenser par les lombaires"]},
    {id:"band-external",name:"Rotation externe élastique",cat:"Prévention",goal:"Renforcer la coiffe des rotateurs.",how:"Coude près du corps à 90°, tourner l'avant-bras vers l'extérieur contre un élastique sans décoller le coude.",cues:["Charge légère","Omoplate stable"],errors:["Coude qui s'écarte","Mouvement du tronc"]}
  ]
};
