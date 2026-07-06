(function () {
  window.MVP_DATA = {
    meta: {
      schemaVersion: "0.1.0",
      generatedFor: "MVP launcher gamer",
      locale: "es-ES",
      lastSync: "2026-07-03T21:16:00-04:00",
      user: {
        id: "usr_nova",
        displayName: "NovaRunner",
        handle: "nova.runner",
        level: 42,
        avatar: "avatars/nova-runner.png",
        status: "online",
        presence: "Preparando raid nocturna",
        homePlatformId: "steam",
        region: "LATAM South",
        timezone: "America/La_Paz"
      }
    },

    platforms: [
      {
        id: "steam",
        name: "Steam",
        type: "store",
        connected: true,
        account: "NovaRunner",
        libraryCount: 248,
        installedCount: 18,
        cloudSync: "synced",
        lastSync: "2026-07-03T20:48:00-04:00",
        accent: "#66c0f4"
      },
      {
        id: "gog",
        name: "GOG",
        type: "store",
        connected: true,
        account: "NovaRunner_GOG",
        libraryCount: 63,
        installedCount: 5,
        cloudSync: "partial",
        lastSync: "2026-07-03T19:30:00-04:00",
        accent: "#86328a"
      },
      {
        id: "battle_net",
        name: "Battle.net",
        type: "store",
        connected: true,
        account: "Nova#1842",
        libraryCount: 11,
        installedCount: 4,
        cloudSync: "synced",
        lastSync: "2026-07-03T20:02:00-04:00",
        accent: "#00aeef"
      },
      {
        id: "xbox",
        name: "Xbox",
        type: "subscription",
        connected: true,
        account: "NovaRunnerX",
        libraryCount: 132,
        installedCount: 7,
        cloudSync: "synced",
        subscription: "Game Pass Ultimate",
        lastSync: "2026-07-03T20:55:00-04:00",
        accent: "#107c10"
      },
      {
        id: "epic",
        name: "Epic Games",
        type: "store",
        connected: true,
        account: "nova.runner",
        libraryCount: 94,
        installedCount: 6,
        cloudSync: "synced",
        lastSync: "2026-07-03T18:12:00-04:00",
        accent: "#2a2a2a"
      },
      {
        id: "riot",
        name: "Riot",
        type: "publisher",
        connected: true,
        account: "NovaRunner#LAS",
        libraryCount: 4,
        installedCount: 3,
        cloudSync: "synced",
        lastSync: "2026-07-03T20:40:00-04:00",
        accent: "#d13639"
      },
      {
        id: "local",
        name: "Apps locales",
        type: "local",
        connected: true,
        account: "Este equipo",
        libraryCount: 9,
        installedCount: 9,
        cloudSync: "not_applicable",
        lastScan: "2026-07-03T20:58:00-04:00",
        accent: "#f4b400"
      }
    ],

    games: [
      {
        id: "game_cyberpunk_2077",
        title: "Cyberpunk 2077",
        platformId: "gog",
        sourceIds: ["gog", "steam"],
        genre: ["RPG", "Accion", "Mundo abierto"],
        cover: "covers/cyberpunk-2077.jpg",
        installed: true,
        favorite: true,
        playState: "ready",
        installPath: "D:/Games/GOG/Cyberpunk 2077",
        sizeGb: 86.4,
        lastPlayed: "2026-07-02T23:10:00-04:00",
        playtimeHours: 214.7,
        rating: 4.8,
        cloudSave: "synced",
        tags: ["single-player", "ray tracing", "modded"],
        launchOptions: ["DX12", "Modo rendimiento"]
      },
      {
        id: "game_baldurs_gate_3",
        title: "Baldur's Gate 3",
        platformId: "steam",
        sourceIds: ["steam", "gog"],
        genre: ["RPG", "Estrategia", "Co-op"],
        cover: "covers/baldurs-gate-3.jpg",
        installed: true,
        favorite: true,
        playState: "ready",
        installPath: "E:/SteamLibrary/steamapps/common/Baldurs Gate 3",
        sizeGb: 149.2,
        lastPlayed: "2026-07-01T22:24:00-04:00",
        playtimeHours: 322.1,
        rating: 5,
        cloudSave: "synced",
        tags: ["campana activa", "co-op semanal"]
      },
      {
        id: "game_diablo_iv",
        title: "Diablo IV",
        platformId: "battle_net",
        sourceIds: ["battle_net", "xbox"],
        genre: ["ARPG", "Online"],
        cover: "covers/diablo-iv.jpg",
        installed: true,
        favorite: false,
        playState: "updating",
        installPath: "D:/Games/Battle.net/Diablo IV",
        sizeGb: 93.8,
        lastPlayed: "2026-06-30T21:35:00-04:00",
        playtimeHours: 118.4,
        rating: 4.1,
        cloudSave: "synced",
        tags: ["temporada", "clan"]
      },
      {
        id: "game_forza_horizon_5",
        title: "Forza Horizon 5",
        platformId: "xbox",
        sourceIds: ["xbox", "steam"],
        genre: ["Carreras", "Mundo abierto"],
        cover: "covers/forza-horizon-5.jpg",
        installed: true,
        favorite: false,
        playState: "ready",
        installPath: "E:/XboxGames/ForzaHorizon5",
        sizeGb: 126.5,
        lastPlayed: "2026-06-29T19:02:00-04:00",
        playtimeHours: 77.3,
        rating: 4.5,
        cloudSave: "synced",
        tags: ["game pass", "volante"]
      },
      {
        id: "game_fortnite",
        title: "Fortnite",
        platformId: "epic",
        sourceIds: ["epic"],
        genre: ["Battle royale", "Shooter"],
        cover: "covers/fortnite.jpg",
        installed: true,
        favorite: false,
        playState: "ready",
        installPath: "D:/Games/Epic/Fortnite",
        sizeGb: 74.6,
        lastPlayed: "2026-07-03T18:40:00-04:00",
        playtimeHours: 56.8,
        rating: 3.9,
        cloudSave: "synced",
        tags: ["squad", "evento activo"]
      },
      {
        id: "game_valorant",
        title: "VALORANT",
        platformId: "riot",
        sourceIds: ["riot"],
        genre: ["Shooter tactico", "Competitivo"],
        cover: "covers/valorant.jpg",
        installed: true,
        favorite: true,
        playState: "ready",
        installPath: "C:/Riot Games/VALORANT",
        sizeGb: 42.1,
        lastPlayed: "2026-07-03T20:12:00-04:00",
        playtimeHours: 604.6,
        rating: 4.4,
        cloudSave: "synced",
        tags: ["ranked", "duo disponible"]
      },
      {
        id: "game_league_of_legends",
        title: "League of Legends",
        platformId: "riot",
        sourceIds: ["riot"],
        genre: ["MOBA", "Competitivo"],
        cover: "covers/league-of-legends.jpg",
        installed: true,
        favorite: false,
        playState: "ready",
        installPath: "C:/Riot Games/League of Legends",
        sizeGb: 25.9,
        lastPlayed: "2026-06-27T22:10:00-04:00",
        playtimeHours: 931.2,
        rating: 4,
        cloudSave: "synced",
        tags: ["flex", "parche nuevo"]
      },
      {
        id: "game_hades_ii",
        title: "Hades II",
        platformId: "steam",
        sourceIds: ["steam", "epic"],
        genre: ["Roguelike", "Accion"],
        cover: "covers/hades-ii.jpg",
        installed: true,
        favorite: true,
        playState: "ready",
        installPath: "E:/SteamLibrary/steamapps/common/Hades II",
        sizeGb: 16.7,
        lastPlayed: "2026-07-03T16:20:00-04:00",
        playtimeHours: 41.9,
        rating: 4.7,
        cloudSave: "synced",
        tags: ["early access", "sesiones cortas"]
      },
      {
        id: "game_overwatch_2",
        title: "Overwatch 2",
        platformId: "battle_net",
        sourceIds: ["battle_net", "steam"],
        genre: ["Hero shooter", "Online"],
        cover: "covers/overwatch-2.jpg",
        installed: false,
        favorite: false,
        playState: "not_installed",
        sizeGb: 58.3,
        lastPlayed: "2026-05-16T20:18:00-04:00",
        playtimeHours: 189.5,
        rating: 3.7,
        cloudSave: "synced",
        tags: ["reinstalable", "amigos activos"]
      },
      {
        id: "game_control_ultimate",
        title: "Control Ultimate Edition",
        platformId: "epic",
        sourceIds: ["epic", "gog"],
        genre: ["Accion", "Aventura"],
        cover: "covers/control-ultimate.jpg",
        installed: false,
        favorite: false,
        playState: "queued",
        sizeGb: 49.8,
        lastPlayed: "2025-12-14T21:00:00-04:00",
        playtimeHours: 18.2,
        rating: 4.3,
        cloudSave: "unknown",
        tags: ["pendiente", "historia"]
      },
      {
        id: "app_minecraft_modded",
        title: "Minecraft Modded",
        platformId: "local",
        sourceIds: ["local"],
        genre: ["Sandbox", "Local"],
        cover: "covers/minecraft-modded.jpg",
        installed: true,
        favorite: true,
        playState: "ready",
        installPath: "D:/Launchers/PrismLauncher",
        sizeGb: 18.5,
        lastPlayed: "2026-06-28T17:42:00-04:00",
        playtimeHours: 144.8,
        rating: 4.6,
        cloudSave: "local_only",
        tags: ["mods", "servidor privado"],
        executable: "PrismLauncher.exe"
      },
      {
        id: "app_emulation_station",
        title: "Emulation Station",
        platformId: "local",
        sourceIds: ["local"],
        genre: ["Retro", "Frontend"],
        cover: "covers/emulation-station.jpg",
        installed: true,
        favorite: false,
        playState: "ready",
        installPath: "D:/Tools/EmulationStation-DE",
        sizeGb: 3.2,
        lastPlayed: "2026-06-24T20:04:00-04:00",
        playtimeHours: 26.5,
        rating: 4.2,
        cloudSave: "local_only",
        tags: ["retro", "controller"]
      }
    ],

    friends: [
      {
        id: "fr_lyra",
        displayName: "Lyra",
        handle: "lyra.codes",
        status: "online",
        platformId: "steam",
        currentGameId: "game_baldurs_gate_3",
        partyOpen: true,
        voice: "Discord",
        lastSeen: "2026-07-03T21:10:00-04:00",
        mutualGames: ["game_baldurs_gate_3", "game_hades_ii", "game_valorant"]
      },
      {
        id: "fr_kade",
        displayName: "Kade",
        handle: "Kade#721",
        status: "in_game",
        platformId: "riot",
        currentGameId: "game_valorant",
        partyOpen: false,
        voice: "Riot Voice",
        lastSeen: "2026-07-03T21:12:00-04:00",
        mutualGames: ["game_valorant", "game_league_of_legends"]
      },
      {
        id: "fr_mara",
        displayName: "Mara",
        handle: "MaraX",
        status: "away",
        platformId: "xbox",
        currentGameId: "game_forza_horizon_5",
        partyOpen: true,
        voice: "Xbox Party",
        lastSeen: "2026-07-03T20:28:00-04:00",
        mutualGames: ["game_forza_horizon_5", "game_fortnite"]
      },
      {
        id: "fr_ion",
        displayName: "Ion",
        handle: "ion.shift",
        status: "offline",
        platformId: "gog",
        currentGameId: null,
        partyOpen: false,
        voice: null,
        lastSeen: "2026-07-02T23:44:00-04:00",
        mutualGames: ["game_cyberpunk_2077", "game_control_ultimate"]
      },
      {
        id: "fr_sol",
        displayName: "Sol",
        handle: "Solstice",
        status: "online",
        platformId: "epic",
        currentGameId: "game_fortnite",
        partyOpen: true,
        voice: "Discord",
        lastSeen: "2026-07-03T21:08:00-04:00",
        mutualGames: ["game_fortnite", "game_overwatch_2"]
      }
    ],

    activity: [
      {
        id: "act_001",
        type: "session",
        gameId: "game_valorant",
        actorId: "usr_nova",
        title: "Partida competitiva completada",
        detail: "Victoria 13-9 en Haven, +18 RR.",
        timestamp: "2026-07-03T20:55:00-04:00"
      },
      {
        id: "act_002",
        type: "friend_joined",
        gameId: "game_baldurs_gate_3",
        actorId: "fr_lyra",
        title: "Lyra abrio una party",
        detail: "Campana cooperativa con 2 espacios disponibles.",
        timestamp: "2026-07-03T20:41:00-04:00"
      },
      {
        id: "act_003",
        type: "achievement",
        gameId: "game_hades_ii",
        actorId: "usr_nova",
        title: "Logro desbloqueado",
        detail: "Nocturna impecable: completa una ruta sin perder desafio.",
        timestamp: "2026-07-03T16:48:00-04:00"
      },
      {
        id: "act_004",
        type: "download",
        gameId: "game_diablo_iv",
        actorId: "system",
        title: "Actualizacion iniciada",
        detail: "Parche de temporada 7.2 descargando.",
        timestamp: "2026-07-03T19:58:00-04:00"
      },
      {
        id: "act_005",
        type: "cloud_sync",
        gameId: "game_cyberpunk_2077",
        actorId: "system",
        title: "Guardado sincronizado",
        detail: "Ultimo save subido a GOG Cloud.",
        timestamp: "2026-07-03T18:05:00-04:00"
      }
    ],

    downloads: [
      {
        id: "dl_diablo_patch",
        gameId: "game_diablo_iv",
        platformId: "battle_net",
        type: "update",
        status: "downloading",
        progress: 62,
        downloadedGb: 7.4,
        totalGb: 12.0,
        speedMbps: 41.8,
        etaMinutes: 11,
        priority: "high",
        canPause: true
      },
      {
        id: "dl_control_install",
        gameId: "game_control_ultimate",
        platformId: "epic",
        type: "install",
        status: "queued",
        progress: 0,
        downloadedGb: 0,
        totalGb: 49.8,
        speedMbps: 0,
        etaMinutes: null,
        priority: "normal",
        canPause: true
      },
      {
        id: "dl_valorant_hotfix",
        gameId: "game_valorant",
        platformId: "riot",
        type: "hotfix",
        status: "completed",
        progress: 100,
        downloadedGb: 1.1,
        totalGb: 1.1,
        speedMbps: 0,
        etaMinutes: 0,
        completedAt: "2026-07-03T20:02:00-04:00",
        priority: "high",
        canPause: false
      }
    ],

    newsAndEvents: [
      {
        id: "news_steam_sale",
        platformId: "steam",
        type: "sale",
        title: "Rebajas de verano: wishlist con descuentos",
        summary: "12 juegos de tu wishlist bajaron de precio, con 4 por debajo del minimo historico.",
        startsAt: "2026-07-03T14:00:00-04:00",
        endsAt: "2026-07-10T14:00:00-04:00",
        gameIds: ["game_hades_ii", "game_overwatch_2"],
        cta: "Ver ofertas"
      },
      {
        id: "event_riot_ranked",
        platformId: "riot",
        type: "event",
        title: "VALORANT: cierre de acto",
        summary: "Ultimos dias para completar recompensas competitivas y pase de batalla.",
        startsAt: "2026-07-01T08:00:00-04:00",
        endsAt: "2026-07-08T23:59:00-04:00",
        gameIds: ["game_valorant"],
        cta: "Jugar ranked"
      },
      {
        id: "news_xbox_gamepass",
        platformId: "xbox",
        type: "subscription",
        title: "Nuevos juegos en Game Pass",
        summary: "Tres lanzamientos disponibles para instalar, incluyendo un RPG tactico y un roguelite.",
        startsAt: "2026-07-03T10:00:00-04:00",
        endsAt: "2026-07-17T10:00:00-04:00",
        gameIds: ["game_forza_horizon_5"],
        cta: "Explorar catalogo"
      },
      {
        id: "event_epic_free",
        platformId: "epic",
        type: "free_game",
        title: "Juego gratis semanal reclamable",
        summary: "Disponible hasta el jueves; se agregara a tu biblioteca al reclamarlo.",
        startsAt: "2026-07-02T11:00:00-04:00",
        endsAt: "2026-07-09T11:00:00-04:00",
        gameIds: [],
        cta: "Reclamar"
      },
      {
        id: "event_bnet_season",
        platformId: "battle_net",
        type: "season",
        title: "Diablo IV: temporada 7 activa",
        summary: "Nueva cadena de misiones, afijos y recompensas de clan.",
        startsAt: "2026-06-28T12:00:00-04:00",
        endsAt: "2026-08-20T12:00:00-04:00",
        gameIds: ["game_diablo_iv"],
        cta: "Ver temporada"
      }
    ],

    achievements: [
      {
        id: "ach_hades_nocturna",
        gameId: "game_hades_ii",
        platformId: "steam",
        name: "Nocturna impecable",
        description: "Completa una ruta sin perder desafio.",
        unlocked: true,
        unlockedAt: "2026-07-03T16:48:00-04:00",
        rarityPercent: 8.4,
        points: 40
      },
      {
        id: "ach_cyberpunk_legend",
        gameId: "game_cyberpunk_2077",
        platformId: "gog",
        name: "Leyenda de Night City",
        description: "Alcanza reputacion maxima.",
        unlocked: true,
        unlockedAt: "2026-06-18T22:17:00-04:00",
        rarityPercent: 14.2,
        points: 80
      },
      {
        id: "ach_bg3_tactician",
        gameId: "game_baldurs_gate_3",
        platformId: "steam",
        name: "Estratega de honor",
        description: "Completa una campana en dificultad tactica.",
        unlocked: false,
        progress: 72,
        rarityPercent: 5.9,
        points: 100
      },
      {
        id: "ach_forza_collector",
        gameId: "game_forza_horizon_5",
        platformId: "xbox",
        name: "Garaje legendario",
        description: "Colecciona 250 vehiculos.",
        unlocked: false,
        progress: 84,
        rarityPercent: 11.7,
        points: 60
      },
      {
        id: "ach_valorant_clutch",
        gameId: "game_valorant",
        platformId: "riot",
        name: "Clutch bajo presion",
        description: "Gana 25 rondas 1v2 o peor.",
        unlocked: false,
        progress: 64,
        rarityPercent: 18.5,
        points: 50
      }
    ],

    settings: {
      appearance: {
        theme: "dark",
        density: "compact",
        accentPlatform: "auto",
        reduceMotion: false,
        showAnimatedCovers: true
      },
      library: {
        defaultSort: "lastPlayed",
        groupBy: "platform",
        showHiddenGames: false,
        includeUninstalled: true,
        scanLocalAppsOnStart: true,
        duplicateStrategy: "prefer_installed"
      },
      downloads: {
        maxConcurrent: 2,
        bandwidthLimitMbps: 90,
        pauseWhenPlayingOnline: true,
        autoUpdateFavorites: true,
        schedule: {
          enabled: true,
          start: "01:00",
          end: "07:00"
        }
      },
      social: {
        showPresence: true,
        allowPartyInvites: "friends",
        defaultVoiceApp: "Discord",
        quietHours: {
          enabled: true,
          start: "23:30",
          end: "09:00"
        }
      },
      integrations: {
        discordRichPresence: true,
        xboxGameBar: true,
        steamOverlay: true,
        gogGalaxyImport: true,
        epicEntitlementSync: true,
        riotClientDeepLinks: true
      },
      privacy: {
        profileVisibility: "friends",
        sharePlaytime: true,
        shareAchievements: true,
        telemetry: "minimal"
      }
    },

    quickActions: [
      {
        id: "qa_resume",
        label: "Continuar ultimo juego",
        action: "launch",
        gameId: "game_valorant",
        enabled: true
      },
      {
        id: "qa_party",
        label: "Unirse a party de Lyra",
        action: "join_party",
        friendId: "fr_lyra",
        gameId: "game_baldurs_gate_3",
        enabled: true
      },
      {
        id: "qa_pause_downloads",
        label: "Pausar descargas",
        action: "pause_downloads",
        enabled: true
      },
      {
        id: "qa_scan_local",
        label: "Escanear apps locales",
        action: "scan_local_apps",
        enabled: true
      }
    ]
  };
})();
