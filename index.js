/// <reference path="../../internal/extension_repo/goja_plugin_types/plugin.d.ts" />
/// <reference path="../../internal/extension_repo/goja_plugin_types/app.d.ts" />
/// <reference path="../../internal/extension_repo/goja_plugin_types/core.d.ts" />

function init() {
    console.log("[Watch-History-Manager] Plugin initialized");

    // Fast in-memory caches to avoid AniList rate limits (max 90 req/min)
    var animeMetadataCache = {};
    var mangaMetadataCache = {};
    var animeCollectionMap = {};
    var mangaCollectionMap = {};
    var lastActionTimes = {};

    function indexAnimeCollection(collection) {
        if (!collection) return;
        try {
            var lists = (collection.MediaListCollection && collection.MediaListCollection.lists) || collection.lists || [];
            for (var i = 0; i < lists.length; i++) {
                var list = lists[i];
                if (list && list.entries) {
                    for (var j = 0; j < list.entries.length; j++) {
                        var entry = list.entries[j];
                        if (entry && entry.media && entry.media.id) {
                            var m = entry.media;
                            var title = String((m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || ("Anime #" + m.id));
                            var coverRaw = (m.coverImage && (m.coverImage.large || m.coverImage.medium || m.coverImage.extraLarge));
                            var meta = {
                                mediaId: m.id,
                                title: title,
                                cover: coverRaw ? String(coverRaw) : "",
                                progress: entry.progress || 0,
                                episodes: m.episodes || 0,
                                totalEpisodes: m.episodes || 0,
                                status: entry.status || null,
                                repeat: entry.repeat || 0,
                                startDate: m.startDate || null,
                                seasonYear: m.seasonYear || (m.startDate && m.startDate.year) || 0
                            };
                            animeCollectionMap[m.id] = meta;
                            animeMetadataCache[m.id] = meta;
                        }
                    }
                }
            }
        } catch (_) {}
    }

    function indexMangaCollection(collection) {
        if (!collection) return;
        try {
            var lists = (collection.MediaListCollection && collection.MediaListCollection.lists) || collection.lists || [];
            for (var i = 0; i < lists.length; i++) {
                var list = lists[i];
                if (list && list.entries) {
                    for (var j = 0; j < list.entries.length; j++) {
                        var entry = list.entries[j];
                        if (entry && entry.media && entry.media.id) {
                            var m = entry.media;
                            var title = String((m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || ("Manga #" + m.id));
                            var coverRaw = (m.coverImage && (m.coverImage.large || m.coverImage.medium || m.coverImage.extraLarge));
                            var meta = {
                                mediaId: m.id,
                                title: title,
                                cover: coverRaw ? String(coverRaw) : "",
                                progress: entry.progress || 0,
                                chapters: m.chapters || 0,
                                status: entry.status || null,
                                repeat: entry.repeat || 0
                            };
                            mangaCollectionMap[m.id] = meta;
                            mangaMetadataCache[m.id] = meta;
                        }
                    }
                }
            }
        } catch (_) {}
    }

    // Cache anime collection whenever Seanime loads it
    $app.onGetAnimeCollection(function(e) {
        if (e.animeCollection) {
            $store.set("latestAnimeCollection", $clone(e.animeCollection));
            if (typeof indexAnimeCollection === "function") {
                try { indexAnimeCollection(e.animeCollection); } catch (_) {}
            }
        }
        e.next();
    });

    // Cache manga collection whenever Seanime loads it
    $app.onGetMangaCollection(function(e) {
        if (e.mangaCollection) {
            $store.set("latestMangaCollection", $clone(e.mangaCollection));
            if (typeof indexMangaCollection === "function") {
                try { indexMangaCollection(e.mangaCollection); } catch (_) {}
            }
        }
        e.next();
    });

    // Cache active anime ID and media details when viewing anime entries
    $app.onGetAnimeDetails(function(e) {
        if (e.anime && e.anime.id) {
            $store.set("lastActiveAnimeId", e.anime.id);
            $store.set("lastActiveAnimeMedia", $clone(e.anime));
            var m = e.anime;
            var title = (m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || ("Anime #" + m.id);
            var coverRaw = (m.coverImage && (m.coverImage.large || m.coverImage.medium || m.coverImage.extraLarge));
            if (typeof animeMetadataCache !== "undefined") {
                var existing = animeMetadataCache[m.id] || {};
                animeMetadataCache[m.id] = {
                    mediaId: m.id,
                    title: title,
                    cover: coverRaw ? String(coverRaw) : (existing.cover || ""),
                    progress: existing.progress || 0,
                    episodes: m.episodes || existing.episodes || 0,
                    totalEpisodes: m.episodes || existing.totalEpisodes || 0,
                    status: existing.status || null,
                    repeat: existing.repeat || 0,
                    startDate: m.startDate || null,
                    seasonYear: m.seasonYear || (m.startDate && m.startDate.year) || 0
                };
            }
        }
        e.next();
    });

    $app.onGetAnime(function(e) {
        if (e.anime && e.anime.id) {
            $store.set("lastActiveAnimeId", e.anime.id);
        }
        e.next();
    });

    $ui.register(function(ctx) {
        console.log("[Watch-History-Manager] Registering UI components and context menu actions");

        // Fast in-memory caches to avoid AniList rate limits (Scoped to UI runtime)
        var animeMetadataCache = {};
        var mangaMetadataCache = {};
        var animeCollectionMap = {};
        var mangaCollectionMap = {};
        var lastActionTimes = {};

        function indexAnimeCollection(collection) {
            if (!collection) return;
            try {
                var lists = (collection.MediaListCollection && collection.MediaListCollection.lists) || collection.lists || [];
                for (var i = 0; i < lists.length; i++) {
                    var list = lists[i];
                    if (list && list.entries) {
                        for (var j = 0; j < list.entries.length; j++) {
                            var entry = list.entries[j];
                            if (entry && entry.media && entry.media.id) {
                                var m = entry.media;
                                var title = String((m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || ("Anime #" + m.id));
                                var coverRaw = (m.coverImage && (m.coverImage.large || m.coverImage.medium || m.coverImage.extraLarge));
                                var meta = {
                                    mediaId: m.id,
                                    title: title,
                                    cover: coverRaw ? String(coverRaw) : "",
                                    progress: entry.progress || 0,
                                    episodes: m.episodes || 0,
                                    totalEpisodes: m.episodes || 0,
                                    status: entry.status || null,
                                    repeat: entry.repeat || 0,
                                    startDate: m.startDate || null,
                                    seasonYear: m.seasonYear || (m.startDate && m.startDate.year) || 0
                                };
                                animeCollectionMap[m.id] = meta;
                                animeMetadataCache[m.id] = meta;
                            }
                        }
                    }
                }
            } catch (_) {}
        }

        function indexMangaCollection(collection) {
            if (!collection) return;
            try {
                var lists = (collection.MediaListCollection && collection.MediaListCollection.lists) || collection.lists || [];
                for (var i = 0; i < lists.length; i++) {
                    var list = lists[i];
                    if (list && list.entries) {
                        for (var j = 0; j < list.entries.length; j++) {
                            var entry = list.entries[j];
                            if (entry && entry.media && entry.media.id) {
                                var m = entry.media;
                                var title = String((m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || ("Manga #" + m.id));
                                var coverRaw = (m.coverImage && (m.coverImage.large || m.coverImage.medium || m.coverImage.extraLarge));
                                var meta = {
                                    mediaId: m.id,
                                    title: title,
                                    cover: coverRaw ? String(coverRaw) : "",
                                    progress: entry.progress || 0,
                                    chapters: m.chapters || 0,
                                    status: entry.status || null,
                                    repeat: entry.repeat || 0
                                };
                                mangaCollectionMap[m.id] = meta;
                                mangaMetadataCache[m.id] = meta;
                            }
                        }
                    }
                }
            } catch (_) {}
        }

        // Pre-warm caches immediately if latest collections exist in store
        try {
            var initCollection = $store.get("latestAnimeCollection");
            if (initCollection) {
                indexAnimeCollection(initCollection);
            }
        } catch (_) {}
        try {
            var initManga = $store.get("latestMangaCollection");
            if (initManga) {
                indexMangaCollection(initManga);
            }
        } catch (_) {}

        // Helper: clean array to prevent null/undefined components
        function cleanItems(arr) {
            if (!arr || !arr.length) return [];
            var out = [];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] !== null && arr[i] !== undefined) {
                    out.push(arr[i]);
                }
            }
            return out;
        }

        // Track screen navigation to maintain current active anime ID
        if (ctx.screen && typeof ctx.screen.onNavigate === "function") {
            try {
                ctx.screen.onNavigate(function(navEv) {
                    if (navEv && navEv.searchParams && navEv.searchParams.id) {
                        var parsedId = parseInt(navEv.searchParams.id, 10);
                        if (parsedId > 0) {
                            $store.set("lastActiveAnimeId", parsedId);
                        }
                    }
                });
            } catch (err) {}
        }

        // Helper: format seconds into MM:SS or HH:MM:SS
        function formatDuration(sec) {
            if (!sec || isNaN(sec) || sec < 0) return "0:00";
            var totalSeconds = Math.floor(sec);
            var hours = Math.floor(totalSeconds / 3600);
            var minutes = Math.floor((totalSeconds % 3600) / 60);
            var seconds = totalSeconds % 60;
            var sSec = seconds < 10 ? "0" + seconds : "" + seconds;
            if (hours > 0) {
                var sMin = minutes < 10 ? "0" + minutes : "" + minutes;
                return hours + ":" + sMin + ":" + sSec;
            }
            return minutes + ":" + sSec;
        }

        // Helper: robust ISO date parser supporting Go nanosecond timestamps and timezone offsets
        function parseIsoDate(str) {
            if (!str) return 0;
            try {
                if (typeof str === "number") return str;
                var s = String(str).trim();
                var t = new Date(s).getTime();
                if (!isNaN(t) && t > 0) return t;

                // Normalize nanoseconds (.123456789 -> .123)
                var clean = s.replace(/\.(\d{3})\d+([Z\+\-].*|$)/, function(_, ms, tz) {
                    return "." + ms + (tz || "");
                });
                t = new Date(clean).getTime();
                if (!isNaN(t) && t > 0) return t;

                // Space separated format: YYYY-MM-DD HH:mm:ss
                clean = clean.replace(" ", "T");
                t = new Date(clean).getTime();
                if (!isNaN(t) && t > 0) return t;

                // Fallback: manual regex extraction
                var parts = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
                if (parts) {
                    return Date.UTC(
                        parseInt(parts[1], 10),
                        parseInt(parts[2], 10) - 1,
                        parseInt(parts[3], 10),
                        parseInt(parts[4], 10),
                        parseInt(parts[5], 10),
                        parseInt(parts[6], 10)
                    );
                }
                return 0;
            } catch (e) {
                return 0;
            }
        }

        // Helper: returns the latest timestamp for a watch history item
        function getItemTimestamp(item) {
            if (!item) return 0;
            var tUpdated = parseIsoDate(item.timeUpdated);
            var tAdded = parseIsoDate(item.timeAdded);
            return Math.max(tUpdated, tAdded);
        }

        // Helper: format relative time
        function formatRelativeTime(dateStr) {
            var timeMs = parseIsoDate(dateStr);
            if (!timeMs) return "";
            var now = new Date().getTime();
            var diffMs = now - timeMs;
            if (isNaN(diffMs) || diffMs < 0) return "Just now";
            var diffMin = Math.floor(diffMs / 60000);
            if (diffMin < 1) return "Just now";
            if (diffMin < 60) return diffMin + "m ago";
            var diffHours = Math.floor(diffMin / 60);
            if (diffHours < 24) return diffHours + "h ago";
            var diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) return diffDays + "d ago";
            return new Date(timeMs).toLocaleDateString();
        }

        // Helper: lookup anime metadata from AniList collection or cache (Rate-Limit safe)
        function getAnimeMetadata(mediaId, allowNetwork) {
            if (!mediaId) return { title: "Unknown", cover: "", progress: 0, episodes: 0, totalEpisodes: 0, status: null, repeat: 0 };

            // 1. Check in-memory metadata cache (instant, zero network requests)
            if (typeof animeMetadataCache !== "undefined" && animeMetadataCache[mediaId]) {
                return animeMetadataCache[mediaId];
            }

            // 2. Check collection indexed map
            if (typeof animeCollectionMap !== "undefined" && animeCollectionMap[mediaId]) {
                if (typeof animeMetadataCache !== "undefined") {
                    animeMetadataCache[mediaId] = animeCollectionMap[mediaId];
                }
                return animeCollectionMap[mediaId];
            }

            // 3. Fallback to latest stored collection
            try {
                var storedCollection = $store.get("latestAnimeCollection");
                if (storedCollection) {
                    if (typeof indexAnimeCollection === "function") {
                        indexAnimeCollection(storedCollection);
                    }
                    if (typeof animeCollectionMap !== "undefined" && animeCollectionMap[mediaId]) {
                        return animeCollectionMap[mediaId];
                    }
                }
            } catch (_) {}

            // 4. Fallback to active anime media if it matches
            try {
                var activeMedia = $store.get("lastActiveAnimeMedia");
                if (activeMedia && activeMedia.id === mediaId) {
                    var activeTitle = (activeMedia.title && (activeMedia.title.userPreferred || activeMedia.title.romaji || activeMedia.title.english)) || ("Anime #" + mediaId);
                    var activeCover = (activeMedia.coverImage && (activeMedia.coverImage.large || activeMedia.coverImage.medium || activeMedia.coverImage.extraLarge));
                    var eps = activeMedia.episodes || 0;
                    var metaFromActive = {
                        mediaId: mediaId,
                        title: activeTitle,
                        cover: activeCover ? String(activeCover) : "",
                        progress: 0,
                        episodes: eps,
                        totalEpisodes: eps,
                        status: null,
                        repeat: 0
                    };
                    if (typeof animeMetadataCache !== "undefined") {
                        animeMetadataCache[mediaId] = metaFromActive;
                    }
                    return metaFromActive;
                }
            } catch (_) {}

            // 5. Explicit user action network fetch (ONLY if allowNetwork is explicitly true to avoid 429 rate limit)
            if (allowNetwork && typeof $anilist !== "undefined") {
                try {
                    if (typeof $anilist.getAnime === "function") {
                        var anime = $anilist.getAnime(mediaId);
                        if (anime) {
                            var netTitle = (anime.title && (anime.title.userPreferred || anime.title.romaji || anime.title.english)) || ("Anime #" + mediaId);
                            var netCover = (anime.coverImage && (anime.coverImage.large || anime.coverImage.medium || anime.coverImage.extraLarge)) || "";
                            var netEpisodes = anime.episodes || 0;
                            var netMeta = {
                                mediaId: mediaId,
                                title: netTitle,
                                cover: netCover ? String(netCover) : "",
                                progress: 0,
                                episodes: netEpisodes,
                                totalEpisodes: netEpisodes,
                                status: null,
                                repeat: 0
                            };
                            if (typeof animeMetadataCache !== "undefined") {
                                animeMetadataCache[mediaId] = netMeta;
                            }
                            return netMeta;
                        }
                    }
                } catch (_) {}
            }

            // Safe fallback without network call (prevents 429 rate limits)
            var fallback = { title: "Anime #" + mediaId, cover: "", progress: 0, episodes: 0, totalEpisodes: 0, status: null, repeat: 0 };
            if (typeof animeMetadataCache !== "undefined") {
                animeMetadataCache[mediaId] = fallback;
            }
            return fallback;
        }

        // Helper: lookup manga metadata from AniList collection or cache (Rate-Limit safe)
        function getMangaMetadata(mediaId, allowNetwork) {
            if (!mediaId) return { title: "Unknown", cover: "", progress: 0, chapters: 0, status: null, repeat: 0 };

            if (typeof mangaMetadataCache !== "undefined" && mangaMetadataCache[mediaId]) {
                return mangaMetadataCache[mediaId];
            }

            if (typeof mangaCollectionMap !== "undefined" && mangaCollectionMap[mediaId]) {
                if (typeof mangaMetadataCache !== "undefined") {
                    mangaMetadataCache[mediaId] = mangaCollectionMap[mediaId];
                }
                return mangaCollectionMap[mediaId];
            }

            try {
                var storedCollection = $store.get("latestMangaCollection");
                if (storedCollection) {
                    if (typeof indexMangaCollection === "function") {
                        indexMangaCollection(storedCollection);
                    }
                    if (typeof mangaCollectionMap !== "undefined" && mangaCollectionMap[mediaId]) {
                        return mangaCollectionMap[mediaId];
                    }
                }
            } catch (_) {}

            if (allowNetwork && typeof $anilist !== "undefined") {
                try {
                    if (typeof $anilist.getManga === "function") {
                        var manga = $anilist.getManga(mediaId);
                        if (manga) {
                            var directMangaTitle = (manga.title && (manga.title.userPreferred || manga.title.romaji || manga.title.english)) || ("Manga #" + mediaId);
                            var directMangaCover = (manga.coverImage && (manga.coverImage.large || manga.coverImage.medium || manga.coverImage.extraLarge)) || "";
                            var directChapters = manga.chapters || 0;
                            var netMangaMeta = { title: directMangaTitle, cover: directMangaCover, progress: 0, chapters: directChapters, status: null, repeat: 0 };
                            if (typeof mangaMetadataCache !== "undefined") {
                                mangaMetadataCache[mediaId] = netMangaMeta;
                            }
                            return netMangaMeta;
                        }
                    }
                } catch (_) {}
            }

            var fallbackManga = { title: "Manga #" + mediaId, cover: "", progress: 0, chapters: 0, status: null, repeat: 0 };
            if (typeof mangaMetadataCache !== "undefined") {
                mangaMetadataCache[mediaId] = fallbackManga;
            }
            return fallbackManga;
        }

        // Helper: determine if an anime history item has already been marked watched on AniList
        function isItemAlreadyWatched(item, meta) {
            if (!item || !meta) return false;
            var epNum = item.episodeNumber || 1;
            var isRewatching = (meta.status === "REPEATING");
            var isCompleted = (meta.status === "COMPLETED");

            if (isRewatching) {
                return !!(meta.progress && meta.progress >= epNum);
            }
            if (isCompleted) {
                return true;
            }
            if (meta.progress && meta.progress >= epNum) {
                return true;
            }
            if (item.duration > 0 && (item.currentTime / item.duration) >= 0.95 && meta.progress >= epNum) {
                return true;
            }
            return false;
        }

        // Helper: Action cooldown/debounce guard to protect AniList rate limit (max 90 req/min)
        function checkActionCooldown(mediaId) {
            var now = new Date().getTime();
            var last = (typeof lastActionTimes !== "undefined" && lastActionTimes[mediaId]) || 0;
            if (now - last < 1200) {
                return false;
            }
            if (typeof lastActionTimes !== "undefined") {
                lastActionTimes[mediaId] = now;
            }
            return true;
        }

        // Helper: Error handler with clear AniList rate limit messaging
        function handleAniListError(err, actionName) {
            var msg = (err && err.message) ? err.message : String(err);
            if (msg.indexOf("429") !== -1 || msg.toLowerCase().indexOf("rate limit") !== -1 || msg.toLowerCase().indexOf("too many requests") !== -1) {
                ctx.toast.error("AniList rate limit reached (max 90 req/min). Please wait ~1 minute before trying again.");
            } else {
                ctx.toast.error("Failed to " + actionName + ": " + msg);
            }
        }

        // =========================================================================
        // CORE ANIME WATCH ACTIONS (CYCLE-SAFE & RATE-LIMIT SAFE)
        // =========================================================================

        /**
         * Mark an entire season as watched.
         * Cycle Safety:
         * If the anime is ALREADY completed (or progress >= totalEpisodes), it STOPS immediately.
         * It never increments past total episodes, preventing AniList from starting an unwanted rewatch cycle.
         */
        function markAnimeSeasonWatched(mediaId, mediaObj) {
            if (!mediaId) {
                ctx.toast.error("Anime data not found");
                return;
            }
            if (!checkActionCooldown(mediaId)) {
                ctx.toast.warning("Please wait a moment before marking again.");
                return;
            }
            try {
                var meta = getAnimeMetadata(mediaId, true);
                var title = (mediaObj && mediaObj.title && (mediaObj.title.userPreferred || mediaObj.title.romaji || mediaObj.title.english)) || meta.title || ("Anime #" + mediaId);

                // Determine accurate total episode count
                var totalEpisodes = (mediaObj && mediaObj.episodes) || meta.episodes || meta.totalEpisodes || 0;
                if (!totalEpisodes) {
                    var activeMedia = $store.get("lastActiveAnimeMedia");
                    if (activeMedia && activeMedia.id === mediaId && activeMedia.episodes) {
                        totalEpisodes = activeMedia.episodes;
                    }
                }

                // STOP GUARD: If already completed or reached totalEpisodes, STOP!
                var isAlreadyCompleted = (meta.status === "COMPLETED");
                if (totalEpisodes > 0 && meta.progress >= totalEpisodes) {
                    isAlreadyCompleted = true;
                }

                if (isAlreadyCompleted) {
                    ctx.toast.info(title + " is already marked as completed (" + (meta.progress || totalEpisodes) + "/" + totalEpisodes + " eps)!");
                    try {
                        if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                            ctx.continuity.deleteWatchHistoryItem(mediaId);
                        }
                    } catch (_) {}
                    return;
                }

                var targetEpisodes = totalEpisodes > 0 ? totalEpisodes : (meta.progress ? meta.progress : 1);
                if (targetEpisodes <= 0) targetEpisodes = 1;

                $anilist.updateEntryProgress(mediaId, targetEpisodes, targetEpisodes);

                // Update local metadata cache immediately so UI reflects COMPLETED status
                meta.progress = targetEpisodes;
                meta.status = "COMPLETED";
                animeMetadataCache[mediaId] = meta;
                if (animeCollectionMap[mediaId]) {
                    animeCollectionMap[mediaId].progress = targetEpisodes;
                    animeCollectionMap[mediaId].status = "COMPLETED";
                }

                try {
                    if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                        ctx.continuity.deleteWatchHistoryItem(mediaId);
                    }
                } catch (_) {}

                $anilist.refreshAnimeCollection();
                ctx.toast.success("Marked entire season of " + title + " as watched (" + targetEpisodes + " eps)!");
            } catch (err) {
                handleAniListError(err, "mark season as watched");
            }
        }
        /**
         * Mark a specific episode as watched.
         * Cycle Safety:
         * Never marks past total episodes. If season is completed, stops.
         */
        function markAnimeEpisodeWatched(mediaId, epNum, mediaObj) {
            if (!mediaId) {
                ctx.toast.error("Anime media ID could not be identified");
                return;
            }
            if (!checkActionCooldown(mediaId)) {
                ctx.toast.warning("Please wait a moment before marking again.");
                return;
            }
            try {
                var meta = getAnimeMetadata(mediaId, false);
                var title = (mediaObj && mediaObj.title && (mediaObj.title.userPreferred || mediaObj.title.romaji || mediaObj.title.english)) || meta.title || ("Anime #" + mediaId);
                var totalEpisodes = (mediaObj && mediaObj.episodes) || meta.episodes || meta.totalEpisodes || 0;

                // STOP GUARD: If already completed and this episode is <= progress, STOP!
                if (meta.status === "COMPLETED" && (totalEpisodes === 0 || epNum <= meta.progress)) {
                    ctx.toast.info("Episode " + epNum + " of " + title + " is already marked as watched (Season completed)!");
                    return;
                }

                if (meta.progress && epNum <= meta.progress && meta.status !== "REPEATING") {
                    ctx.toast.info("Episode " + epNum + " of " + title + " is already recorded as watched (current progress: Ep " + meta.progress + ").");
                    return;
                }

                if (totalEpisodes > 0 && epNum > totalEpisodes) {
                    epNum = totalEpisodes;
                }

                var totalCountParam = totalEpisodes > 0 ? totalEpisodes : undefined;
                $anilist.updateEntryProgress(mediaId, epNum, totalCountParam);

                meta.progress = epNum;
                if (totalEpisodes > 0 && epNum >= totalEpisodes) {
                    meta.status = "COMPLETED";
                }
                animeMetadataCache[mediaId] = meta;
                if (animeCollectionMap[mediaId]) {
                    animeCollectionMap[mediaId].progress = epNum;
                    if (totalEpisodes > 0 && epNum >= totalEpisodes) {
                        animeCollectionMap[mediaId].status = "COMPLETED";
                    }
                }

                $anilist.refreshAnimeCollection();
                ctx.toast.success("Marked Episode " + epNum + " of " + title + " as watched!");
            } catch (err) {
                handleAniListError(err, "mark episode as watched");
            }
        }

        /**
         * Mark the next unwatched episode as watched.
         * Cycle Safety:
         * Stops once all episodes are completed. Never advances past totalEpisodes.
         */
        function markAnimeNextEpisodeWatched(mediaId, mediaObj) {
            if (!mediaId) {
                ctx.toast.error("Media data not found");
                return;
            }
            if (!checkActionCooldown(mediaId)) {
                ctx.toast.warning("Please wait a moment before marking again.");
                return;
            }
            try {
                var meta = getAnimeMetadata(mediaId, false);
                var title = (mediaObj && mediaObj.title && (mediaObj.title.userPreferred || mediaObj.title.romaji || mediaObj.title.english)) || meta.title || ("Anime #" + mediaId);
                var totalEpisodes = (mediaObj && mediaObj.episodes) || meta.episodes || meta.totalEpisodes || 0;

                // STOP GUARD: If already completed or reached max episodes, STOP!
                if (meta.status === "COMPLETED" || (totalEpisodes > 0 && meta.progress >= totalEpisodes)) {
                    ctx.toast.info(title + " is already completed (" + (meta.progress || totalEpisodes) + "/" + (totalEpisodes || meta.progress) + " eps)! No next episode to mark.");
                    return;
                }

                var nextEp = (meta.progress || 0) + 1;
                if (totalEpisodes > 0 && nextEp > totalEpisodes) {
                    ctx.toast.info("All " + totalEpisodes + " episodes of " + title + " are already watched!");
                    return;
                }

                var totalCountParam = totalEpisodes > 0 ? totalEpisodes : undefined;
                $anilist.updateEntryProgress(mediaId, nextEp, totalCountParam);

                meta.progress = nextEp;
                if (totalEpisodes > 0 && nextEp >= totalEpisodes) {
                    meta.status = "COMPLETED";
                }
                animeMetadataCache[mediaId] = meta;
                if (animeCollectionMap[mediaId]) {
                    animeCollectionMap[mediaId].progress = nextEp;
                    if (totalEpisodes > 0 && nextEp >= totalEpisodes) {
                        animeCollectionMap[mediaId].status = "COMPLETED";
                    }
                }

                $anilist.refreshAnimeCollection();
                ctx.toast.success("Updated " + title + ": Episode " + nextEp + " watched!");
            } catch (err) {
                handleAniListError(err, "update progress");
            }
        }

        /**
         * Remove anime entry from local watch history (Continuity).
         */
        function removeFromWatchHistory(mediaId, mediaObj) {
            if (!mediaId) {
                ctx.toast.error("Anime media ID could not be identified");
                return;
            }
            try {
                if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                    ctx.continuity.deleteWatchHistoryItem(mediaId);
                }
                var meta = (typeof animeCollectionMap !== "undefined" && animeCollectionMap[mediaId]) || (typeof animeMetadataCache !== "undefined" && animeMetadataCache[mediaId]);
                var title = (mediaObj && mediaObj.title && (mediaObj.title.userPreferred || mediaObj.title.romaji || mediaObj.title.english)) || (meta && meta.title) || ("Anime #" + mediaId);
                ctx.toast.success("Removed \"" + title + "\" from watch history");
                try {
                    tray.update();
                } catch (_) {}
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to remove from watch history: " + msg);
            }
        }

        // =========================================================================
        // CORE MANGA ACTIONS (CYCLE-SAFE & RATE-LIMIT SAFE)
        // =========================================================================

        function markMangaCompleted(mediaId, mediaObj) {
            if (!mediaId) {
                ctx.toast.error("Manga data not found");
                return;
            }
            if (!checkActionCooldown(mediaId)) {
                ctx.toast.warning("Please wait a moment before marking again.");
                return;
            }
            try {
                var meta = getMangaMetadata(mediaId, true);
                var title = (mediaObj && mediaObj.title && (mediaObj.title.userPreferred || mediaObj.title.romaji || mediaObj.title.english)) || meta.title || ("Manga #" + mediaId);
                var totalChapters = (mediaObj && mediaObj.chapters) || meta.chapters || 0;

                // STOP GUARD
                if (meta.status === "COMPLETED" || (totalChapters > 0 && meta.progress >= totalChapters)) {
                    ctx.toast.info(title + " is already marked as completed (" + (meta.progress || totalChapters) + "/" + totalChapters + " ch)!");
                    return;
                }

                var targetChapters = totalChapters > 0 ? totalChapters : (meta.progress ? meta.progress : 1);
                $anilist.updateEntryProgress(mediaId, targetChapters, targetChapters);

                meta.progress = targetChapters;
                meta.status = "COMPLETED";
                mangaMetadataCache[mediaId] = meta;
                if (mangaCollectionMap[mediaId]) {
                    mangaCollectionMap[mediaId].progress = targetChapters;
                    mangaCollectionMap[mediaId].status = "COMPLETED";
                }

                $anilist.refreshMangaCollection();
                ctx.toast.success("Marked " + title + " as Completed (" + targetChapters + " chapters)!");
            } catch (err) {
                handleAniListError(err, "mark manga as completed");
            }
        }

        function markMangaNextChapterRead(mediaId, mediaObj) {
            if (!mediaId) {
                ctx.toast.error("Manga data not found");
                return;
            }
            if (!checkActionCooldown(mediaId)) {
                ctx.toast.warning("Please wait a moment before marking again.");
                return;
            }
            try {
                var meta = getMangaMetadata(mediaId, false);
                var title = (mediaObj && mediaObj.title && (mediaObj.title.userPreferred || mediaObj.title.romaji || mediaObj.title.english)) || meta.title || ("Manga #" + mediaId);
                var totalChapters = (mediaObj && mediaObj.chapters) || meta.chapters || 0;

                // STOP GUARD
                if (meta.status === "COMPLETED" || (totalChapters > 0 && meta.progress >= totalChapters)) {
                    ctx.toast.info(title + " is already completed (" + (meta.progress || totalChapters) + "/" + totalChapters + " ch)! No next chapter to mark.");
                    return;
                }

                var nextChap = (meta.progress || 0) + 1;
                if (totalChapters > 0 && nextChap > totalChapters) {
                    ctx.toast.info("All " + totalChapters + " chapters of " + title + " are already read!");
                    return;
                }

                var totalCountParam = totalChapters > 0 ? totalChapters : undefined;
                $anilist.updateEntryProgress(mediaId, nextChap, totalCountParam);

                meta.progress = nextChap;
                if (totalChapters > 0 && nextChap >= totalChapters) {
                    meta.status = "COMPLETED";
                }
                mangaMetadataCache[mediaId] = meta;
                if (mangaCollectionMap[mediaId]) {
                    mangaCollectionMap[mediaId].progress = nextChap;
                    if (totalChapters > 0 && nextChap >= totalChapters) {
                        mangaCollectionMap[mediaId].status = "COMPLETED";
                    }
                }

                $anilist.refreshMangaCollection();
                ctx.toast.success("Updated " + title + ": Chapter " + nextChap + " read!");
            } catch (err) {
                handleAniListError(err, "update manga progress");
            }
        }

        // =========================================================================
        // EPISODE CONTEXT RESOLUTION (Grid, Streams, Local Files)
        // =========================================================================

        function resolveEpisodeContext(event) {
            var ep = event && event.episode;
            var epNum = 1;
            var mediaId = null;

            if (event) {
                if (typeof event.mediaId === "number") {
                    mediaId = event.mediaId;
                } else if (typeof event.animeId === "number") {
                    mediaId = event.animeId;
                } else if (event.media && typeof event.media.id === "number") {
                    mediaId = event.media.id;
                }
            }

            if (ep) {
                if (typeof ep.number === "number") {
                    epNum = ep.number;
                } else if (typeof ep.progressNumber === "number") {
                    epNum = ep.progressNumber;
                } else if (typeof ep.episodeNumber === "number") {
                    epNum = ep.episodeNumber;
                } else if (typeof ep.id === "number") {
                    epNum = ep.id;
                }

                if (!mediaId) {
                    if (ep.mediaId) {
                        mediaId = ep.mediaId;
                    } else if (ep.animeId) {
                        mediaId = ep.animeId;
                    } else if (ep.localFile && ep.localFile.mediaId) {
                        mediaId = ep.localFile.mediaId;
                    } else if (ep.metadata && ep.metadata.localFile && ep.metadata.localFile.mediaId) {
                        mediaId = ep.metadata.localFile.mediaId;
                    } else if (ep.media && ep.media.id) {
                        mediaId = ep.media.id;
                    }
                }
            }

            if (!mediaId) {
                mediaId = $store.get("lastActiveAnimeId") || null;
            }

            if (!mediaId && typeof window !== "undefined" && window.location) {
                var match = window.location.search.match(/[?&](?:id|mediaId)=(\d+)/);
                if (match) {
                    mediaId = parseInt(match[1], 10);
                }
            }

            return {
                mediaId: mediaId,
                epNum: epNum,
                episode: ep
            };
        }


        // =========================================================================
        // ANIME ACTIONS (Anime Page Dropdown, Header Button, Context Menus)
        // =========================================================================

        // --- Action A1: Anime Page 3-dot Dropdown: "Mark Season as Watched" ---
        var animeDropdownMarkSeasonWatched = ctx.action.newAnimePageDropdownItem({
            label: "Mark Season as Watched"
        });
        animeDropdownMarkSeasonWatched.mount();
        animeDropdownMarkSeasonWatched.onClick(function(event) {
            var media = event && event.media;
            var mediaId = (media && media.id) || $store.get("lastActiveAnimeId");
            markAnimeSeasonWatched(mediaId, media);
        });

        // --- Action A2: Anime Page 3-dot Dropdown: "Mark Next Episode as Watched" ---
        var animeDropdownMarkNextEpWatched = ctx.action.newAnimePageDropdownItem({
            label: "Mark Next Episode as Watched"
        });
        animeDropdownMarkNextEpWatched.mount();
        animeDropdownMarkNextEpWatched.onClick(function(event) {
            var media = event && event.media;
            var mediaId = (media && media.id) || $store.get("lastActiveAnimeId");
            markAnimeNextEpisodeWatched(mediaId, media);
        });

        // --- Action A3: Anime Page 3-dot Dropdown: "Remove from Watch History" ---
        var animeDropdownRemoveHistory = ctx.action.newAnimePageDropdownItem({
            label: "Remove from Watch History"
        });
        animeDropdownRemoveHistory.mount();
        animeDropdownRemoveHistory.onClick(function(event) {
            var media = event && event.media;
            var mediaId = (media && media.id) || $store.get("lastActiveAnimeId");
            removeFromWatchHistory(mediaId, media);
        });

        // --- Action A4: Anime Page 3-dot Dropdown: "Open Watch History" ---
        var animeDropdownOpenHistory = ctx.action.newAnimePageDropdownItem({
            label: "Open Watch History"
        });
        animeDropdownOpenHistory.mount();
        animeDropdownOpenHistory.onClick(function() {
            try {
                tray.open();
                tray.update();
            } catch (e) {}
        });

        // --- Action A5: Anime Page Header Button: "Mark Ep Watched" ---
        var animePageButton = ctx.action.newAnimePageButton({
            label: "Mark Ep Watched",
            intent: "primary-subtle",
            tooltipText: "Mark next episode as watched on AniList"
        });
        animePageButton.mount();
        animePageButton.onClick(function(event) {
            var media = event && event.media;
            var mediaId = (media && media.id) || $store.get("lastActiveAnimeId");
            markAnimeNextEpisodeWatched(mediaId, media);
        });

        // --- Action A6: Episode Card Right-Click Menu: "Mark Episode as Watched" ---
        var episodeCardMarkWatched = ctx.action.newEpisodeCardContextMenuItem({
            label: "Mark Episode as Watched"
        });
        episodeCardMarkWatched.mount();
        episodeCardMarkWatched.onClick(function(event) {
            var info = resolveEpisodeContext(event);
            if (!info.mediaId) {
                ctx.toast.error("Anime media ID could not be identified");
                return;
            }
            var activeMedia = $store.get("lastActiveAnimeMedia");
            markAnimeEpisodeWatched(info.mediaId, info.epNum, activeMedia);
        });

        // --- Action A7: Episode Card Right-Click Menu: "Mark Next Episode as Watched" ---
        var episodeCardMarkNextEp = ctx.action.newEpisodeCardContextMenuItem({
            label: "Mark Next Episode as Watched"
        });
        episodeCardMarkNextEp.mount();
        episodeCardMarkNextEp.onClick(function(event) {
            var info = resolveEpisodeContext(event);
            if (!info.mediaId) {
                ctx.toast.error("Anime media ID could not be identified");
                return;
            }
            var activeMedia = $store.get("lastActiveAnimeMedia");
            markAnimeNextEpisodeWatched(info.mediaId, activeMedia);
        });

        // --- Action A8: Episode Card Right-Click Menu: "Mark Season as Watched" ---
        var episodeCardMarkSeason = ctx.action.newEpisodeCardContextMenuItem({
            label: "Mark Season as Watched"
        });
        episodeCardMarkSeason.mount();
        episodeCardMarkSeason.onClick(function(event) {
            var info = resolveEpisodeContext(event);
            if (!info.mediaId) {
                ctx.toast.error("Anime media ID could not be identified");
                return;
            }
            var activeMedia = $store.get("lastActiveAnimeMedia");
            markAnimeSeasonWatched(info.mediaId, activeMedia);
        });

        // --- Action A9: Episode Card Right-Click Menu: "Remove from Watch History" ---
        var episodeCardRemoveHistory = ctx.action.newEpisodeCardContextMenuItem({
            label: "Remove from Watch History"
        });
        episodeCardRemoveHistory.mount();
        episodeCardRemoveHistory.onClick(function(event) {
            var info = resolveEpisodeContext(event);
            if (!info.mediaId) {
                ctx.toast.error("Anime media ID could not be identified");
                return;
            }
            var activeMedia = $store.get("lastActiveAnimeMedia");
            removeFromWatchHistory(info.mediaId, activeMedia);
        });

        // --- Action A10: Media Card Right-Click Menu: "Mark Season as Watched" ---
        var mediaCardMarkCompleted = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Season as Watched",
            for: "anime"
        });
        mediaCardMarkCompleted.mount();
        mediaCardMarkCompleted.onClick(function(event) {
            var media = event && event.media;
            var mediaId = (media && media.id) || $store.get("lastActiveAnimeId");
            markAnimeSeasonWatched(mediaId, media);
        });

        // --- Action A11: Media Card Right-Click Menu: "Mark Next Episode as Watched" ---
        var mediaCardMarkNextEp = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Next Episode as Watched",
            for: "anime"
        });
        mediaCardMarkNextEp.mount();
        mediaCardMarkNextEp.onClick(function(event) {
            var media = event && event.media;
            var mediaId = (media && media.id) || $store.get("lastActiveAnimeId");
            markAnimeNextEpisodeWatched(mediaId, media);
        });

        // --- Action A12: Media Card Right-Click Menu: "Remove from Watch History" ---
        var mediaCardRemoveHistory = ctx.action.newMediaCardContextMenuItem({
            label: "Remove from Watch History",
            for: "anime"
        });
        mediaCardRemoveHistory.mount();
        mediaCardRemoveHistory.onClick(function(event) {
            var media = event && event.media;
            var mediaId = (media && media.id) || $store.get("lastActiveAnimeId");
            removeFromWatchHistory(mediaId, media);
        });

        // =========================================================================
        // EPISODE GRID ITEM CONTEXT MENU (Online Stream, Torrent, Debrid, Library)
        // =========================================================================
        var streamTypes = ["library", "torrentstream", "debridstream", "onlinestream", "undownloaded", "medialinks", "mediastream"];
        for (var stIdx = 0; stIdx < streamTypes.length; stIdx++) {
            (function(sType) {
                var gridItemMarkEp = ctx.action.newEpisodeGridItemMenuItem({
                    label: "Mark Episode as Watched",
                    type: sType
                });
                gridItemMarkEp.mount();
                gridItemMarkEp.onClick(function(ev) {
                    var info = resolveEpisodeContext(ev);
                    if (!info.mediaId) {
                        ctx.toast.error("Anime media ID could not be identified");
                        return;
                    }
                    var activeMedia = $store.get("lastActiveAnimeMedia");
                    markAnimeEpisodeWatched(info.mediaId, info.epNum, activeMedia);
                });

                var gridItemMarkSeason = ctx.action.newEpisodeGridItemMenuItem({
                    label: "Mark Season as Watched",
                    type: sType
                });
                gridItemMarkSeason.mount();
                gridItemMarkSeason.onClick(function(ev) {
                    var info = resolveEpisodeContext(ev);
                    if (!info.mediaId) {
                        ctx.toast.error("Anime media ID could not be identified");
                        return;
                    }
                    var activeMedia = $store.get("lastActiveAnimeMedia");
                    markAnimeSeasonWatched(info.mediaId, activeMedia);
                });

                var gridItemRemoveHistory = ctx.action.newEpisodeGridItemMenuItem({
                    label: "Remove from Watch History",
                    type: sType
                });
                gridItemRemoveHistory.mount();
                gridItemRemoveHistory.onClick(function(ev) {
                    var info = resolveEpisodeContext(ev);
                    if (!info.mediaId) {
                        ctx.toast.error("Anime media ID could not be identified");
                        return;
                    }
                    var activeMedia = $store.get("lastActiveAnimeMedia");
                    removeFromWatchHistory(info.mediaId, activeMedia);
                });
            })(streamTypes[stIdx]);
        }

        // =========================================================================
        // MANGA ACTIONS
        // =========================================================================

        // --- Action M1: Manga Page 3-dot Dropdown: "Mark Manga / Season as Completed" ---
        var mangaDropdownMarkMangaRead = ctx.action.newMangaPageDropdownItem({
            label: "Mark Manga / Season as Completed"
        });
        mangaDropdownMarkMangaRead.mount();
        mangaDropdownMarkMangaRead.onClick(function(event) {
            var media = event && event.media;
            if (!media || !media.id) {
                ctx.toast.error("Manga data not found");
                return;
            }
            markMangaCompleted(media.id, media);
        });

        // --- Action M2: Manga Page 3-dot Dropdown: "Mark Next Chapter as Read" ---
        var mangaDropdownMarkNextChapterRead = ctx.action.newMangaPageDropdownItem({
            label: "Mark Next Chapter as Read"
        });
        mangaDropdownMarkNextChapterRead.mount();
        mangaDropdownMarkNextChapterRead.onClick(function(event) {
            var media = event && event.media;
            if (!media || !media.id) {
                ctx.toast.error("Manga data not found");
                return;
            }
            markMangaNextChapterRead(media.id, media);
        });

        // --- Action M3: Manga Page Button: "Mark Chapter Read" ---
        var mangaPageButton = ctx.action.newMangaPageButton({
            label: "Mark Chapter Read",
            intent: "primary-subtle",
            tooltipText: "Quickly mark next chapter as read on AniList"
        });
        mangaPageButton.mount();
        mangaPageButton.onClick(function(event) {
            var media = event && event.media;
            if (!media || !media.id) {
                ctx.toast.error("Manga data not found");
                return;
            }
            markMangaNextChapterRead(media.id, media);
        });

        // --- Action M4: Media Card Right-Click Menu: "Mark Next Chapter as Read" ---
        // --- Action M4: Media Card Right-Click Menu: "Mark Next Chapter as Read" ---
        var mediaCardMarkNextChapter = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Next Chapter as Read",
            for: "manga"
        });
        mediaCardMarkNextChapter.mount();
        mediaCardMarkNextChapter.onClick(function(event) {
            var media = event && event.media;
            if (!media || !media.id) {
                ctx.toast.error("Media data not found");
                return;
            }
            markMangaNextChapterRead(media.id, media);
        });

        // --- Action M5: Media Card Right-Click Menu: "Mark Manga as Completed" ---
        var mediaCardMarkMangaCompleted = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Manga as Completed",
            for: "manga"
        });
        mediaCardMarkMangaCompleted.mount();
        mediaCardMarkMangaCompleted.onClick(function(event) {
            var media = event && event.media;
            if (!media || !media.id) {
                ctx.toast.error("Manga data not found");
                return;
            }
            markMangaCompleted(media.id, media);
        });

        // =========================================================================
        // WATCH HISTORY TRAY DRAWER
        // =========================================================================
        var tray = ctx.newTray({
            iconUrl: "data:image/png;base64,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",
            withContent: true,
            width: "480px"
        });

        tray.onClick(function() {
            try { tray.open(); } catch(e) {}
            try { tray.update(); } catch(e) {}
        });

        tray.onOpen(function() {
            try { tray.update(); } catch(e) {}
        });

        tray.render(function() {
            var rawHistory = null;
            try {
                if (ctx.continuity && typeof ctx.continuity.getWatchHistory === "function") {
                    rawHistory = ctx.continuity.getWatchHistory();
                }
            } catch (err) {
                console.log("[Watch-History-Manager] Continuity read error: " + err);
            }

            if (!rawHistory) {
                tray.stack({
                    gap: 3,
                    className: "p-4 text-center items-center justify-center min-h-[200px]",
                    items: [
                        tray.text("No watch history found.", { className: "text-gray-400 text-sm font-medium" }),
                        tray.text("Start playing an episode and it will automatically appear here with live progress.", {
                            className: "text-gray-500 text-xs mt-1"
                        })
                    ]
                });
                return;
            }

            // Convert raw history record into list of valid items
            var allItems = [];
            var keys = Object.keys(rawHistory);
            for (var k = 0; k < keys.length; k++) {
                var it = rawHistory[keys[k]];
                if (it && it.mediaId && (it.duration > 0 || it.currentTime > 0)) {
                    allItems.push(it);
                }
            }

            // Custom watch order sorting:
            // 1. Prioritize currently-watching anime (status === "CURRENT")
            // 2. Sort by release date (latest release date / seasonYear first)
            // 3. Fall back to actual watch timestamp (Most recently watched first)
            allItems.sort(function(a, b) {
                var metaA = getAnimeMetadata(a.mediaId);
                var metaB = getAnimeMetadata(b.mediaId);

                var isCurrentA = (metaA.status === "CURRENT");
                var isCurrentB = (metaB.status === "CURRENT");

                if (isCurrentA && !isCurrentB) return -1;
                if (!isCurrentA && isCurrentB) return 1;

                var yearA = (metaA.seasonYear || (metaA.startDate && metaA.startDate.year) || 0);
                var yearB = (metaB.seasonYear || (metaB.startDate && metaB.startDate.year) || 0);
                if (yearA !== yearB) {
                    return yearB - yearA; // Newer release date first
                }

                var diff = getItemTimestamp(b) - getItemTimestamp(a);
                if (diff !== 0) return diff;
                var sA = a.timeUpdated || a.timeAdded || "";
                var sB = b.timeUpdated || b.timeAdded || "";
                return sB.localeCompare(sA);
            });

            // Read user preference for filtering watched items (default: hide already watched)
            var hideWatchedPref = $storage.get("hide_watched");
            var hideWatched = (hideWatchedPref !== false);

            // Separate active (unwatched) vs already watched/completed items
            var activeItems = [];
            for (var i = 0; i < allItems.length; i++) {
                var itm = allItems[i];
                var metaData = getAnimeMetadata(itm.mediaId);
                if (!isItemAlreadyWatched(itm, metaData)) {
                    activeItems.push(itm);
                }
            }

            var displayItems = hideWatched ? activeItems : allItems;

            if (displayItems.length === 0) {
                tray.stack({
                    gap: 3,
                    className: "p-4 text-center items-center justify-center min-h-[200px]",
                    items: [
                        tray.text(hideWatched && allItems.length > 0 ? "All recent watch history is marked as watched!" : "No watch history available.", {
                            className: "text-gray-300 text-sm font-semibold"
                        }),
                        tray.text(hideWatched && allItems.length > 0 ? "You have finished or synced all current items on AniList." : "Playback progress will appear here automatically.", {
                            className: "text-gray-500 text-xs mt-1"
                        }),
                        tray.flex({
                            direction: "row",
                            className: "mt-3 gap-2 justify-center",
                            items: [
                                allItems.length > 0 ? tray.button({
                                    label: hideWatched ? "Show Watched Items (" + allItems.length + ")" : "Hide Watched Items",
                                    size: "xs",
                                    intent: "primary-subtle",
                                    onClick: ctx.eventHandler("toggle-hide-watched-empty", function() {
                                        $storage.set("hide_watched", !hideWatched);
                                        tray.update();
                                    })
                                }) : null,
                                tray.button({
                                    label: "Refresh",
                                    size: "xs",
                                    intent: "gray-subtle",
                                    onClick: ctx.eventHandler("refresh-empty-history", function() {
                                        tray.update();
                                    })
                                })
                            ].filter(Boolean)
                        })
                    ]
                });
                return;
            }

            var itemCards = [];

            // Header summary bar
            itemCards.push(
                tray.flex({
                    direction: "row",
                    className: "items-center justify-between pb-3 border-b border-gray-800/80 mb-2",
                    items: [
                        tray.stack({
                            gap: 0,
                            items: [
                                tray.text("Watch History (" + displayItems.length + ")", {
                                    className: "text-base font-bold text-white tracking-wide"
                                }),
                                tray.text(hideWatched ? "Active unwatched items (Latest watched first)" : "All watch history items (Latest watched first)", {
                                    className: "text-xs text-gray-400"
                                })
                            ]
                        }),
                        tray.flex({
                            direction: "row",
                            className: "gap-2 items-center",
                            items: [
                                tray.button({
                                    label: hideWatched ? "Active (" + activeItems.length + ")" : "All (" + allItems.length + ")",
                                    size: "xs",
                                    intent: hideWatched ? "primary-subtle" : "gray-subtle",
                                    onClick: ctx.eventHandler("toggle-hide-watched-hdr", function() {
                                        $storage.set("hide_watched", !hideWatched);
                                        tray.update();
                                    })
                                }),
                                tray.button({
                                    label: "Refresh",
                                    size: "xs",
                                    intent: "gray-subtle",
                                    onClick: ctx.eventHandler("refresh-history-list", function() {
                                        tray.update();
                                    })
                                })
                            ]
                        })
                    ]
                })
            );

            // Render each history item card
            for (var idx = 0; idx < displayItems.length; idx++) {
                (function(historyItem) {
                    var mId = historyItem.mediaId;
                    var epNum = historyItem.episodeNumber || 1;
                    var currTime = historyItem.currentTime || 0;
                    var duration = historyItem.duration || 0;
                    var percent = duration > 0 ? Math.min(100, Math.round((currTime / duration) * 100)) : 0;
                    var relativeTime = formatRelativeTime(historyItem.timeUpdated || historyItem.timeAdded);

                    var meta = getAnimeMetadata(mId);
                    var title = meta.title;
                    var coverImage = meta.cover;
                    var isCompleted = (meta.status === "COMPLETED");
                    var isRewatching = (meta.status === "REPEATING");

                    // Status badge text
                    var statusBadge = null;
                    if (isRewatching) {
                        statusBadge = " [Rewatching]";
                    } else if (isCompleted) {
                        statusBadge = " [Completed]";
                    }

                    var cardComponents = [];

                    if (coverImage) {
                        cardComponents.push(
                            tray.img({
                                src: String(coverImage),
                                alt: String(title),
                                className: "w-20 h-28 object-cover rounded-md flex-shrink-0 shadow-md border border-gray-800"
                            })
                        );
                    }

                    cardComponents.push(
                        tray.stack({
                            gap: 1,
                            className: "flex-1 min-w-0 justify-between",
                            items: [
                                tray.stack({
                                    gap: 0,
                                    items: [
                                        tray.text(title + (statusBadge ? statusBadge : ""), {
                                            className: "font-semibold text-white text-sm truncate leading-snug"
                                        }),
                                        tray.flex({
                                            direction: "row",
                                            className: "items-center gap-2 mt-0.5",
                                            items: [
                                                tray.badge({
                                                    text: "Episode " + epNum,
                                                    intent: "primary-subtle",
                                                    size: "sm"
                                                }),
                                                tray.text(relativeTime, {
                                                    className: "text-xs text-gray-400"
                                                })
                                            ]
                                        })
                                    ]
                                }),

                                // Progress bar + Timestamps
                                tray.stack({
                                    gap: 1,
                                    className: "w-full my-1",
                                    items: [
                                        tray.div({
                                            className: "w-full bg-gray-800 rounded-full h-1.5 overflow-hidden",
                                            items: [
                                                tray.div({
                                                    className: (percent > 85 ? "bg-emerald-500" : "bg-indigo-500") + " h-1.5 rounded-full transition-all",
                                                    style: { width: percent + "%" }
                                                })
                                            ]
                                        }),
                                        tray.flex({
                                            direction: "row",
                                            className: "justify-between text-xs text-gray-400 font-mono",
                                            items: [
                                                tray.text(formatDuration(currTime), { className: "text-xs text-gray-300 font-mono" }),
                                                tray.text(percent + "% (" + formatDuration(duration) + ")", { className: "text-xs text-gray-400 font-mono" })
                                            ]
                                        })
                                    ]
                                }),

                                        // Action Buttons Row: Mark Ep Watched, Mark Season Watched, Go to Anime, Remove
                                tray.flex({
                                    direction: "row",
                                    className: "gap-1.5 flex-wrap items-center pt-1",
                                    items: [
                                        tray.button({
                                            label: "Mark Ep " + epNum + " Watched",
                                            size: "xs",
                                            intent: "primary-subtle",
                                            onClick: ctx.eventHandler("history-mark-ep-" + mId + "-" + epNum, function() {
                                                markAnimeEpisodeWatched(mId, epNum, meta);
                                                try {
                                                    if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                                                        ctx.continuity.deleteWatchHistoryItem(mId);
                                                    }
                                                } catch (e) {}
                                                tray.update();
                                            })
                                        }),
                                        tray.button({
                                            label: "Mark Season Watched",
                                            size: "xs",
                                            intent: "gray-subtle",
                                            onClick: ctx.eventHandler("history-mark-season-" + mId, function() {
                                                markAnimeSeasonWatched(mId, meta);
                                                tray.update();
                                            })
                                        }),
tray.button({
                                            label: "Go to Anime",
                                            size: "xs",
                                            intent: "gray-subtle",
                                            onClick: ctx.eventHandler("history-goto-" + mId, function() {
                                                tray.close();
                                                if (ctx.screen && typeof ctx.screen.navigateTo === "function") {
                                                    ctx.screen.navigateTo("/entry", { id: "" + mId });
                                                }
                                            })
                                        }),
                                        tray.button({
                                            label: "Remove from History",
                                            size: "xs",
                                            intent: "alert-subtle",
                                            onClick: ctx.eventHandler("history-remove-" + mId, function() {
                                                removeFromWatchHistory(mId, meta);
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    );

itemCards.push(
                        tray.div({
                            className: "p-3 bg-gray-900/90 border border-gray-800 rounded-lg shadow-sm hover:border-gray-700 transition-colors",
                            items: [
                                tray.flex({
                                    direction: "row",
                                    className: "gap-3 items-center w-full",
                                    items: cardComponents
                                })
                            ]
                        })
                    );
                })(displayItems[idx]);
            }

            tray.stack({
                gap: 3,
                className: "p-1 pb-6",
                items: itemCards
            });
        });
    });
}

