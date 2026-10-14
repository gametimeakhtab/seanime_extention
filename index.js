/// <reference path="../../internal/extension_repo/goja_plugin_types/plugin.d.ts" />
/// <reference path="../../internal/extension_repo/goja_plugin_types/app.d.ts" />
/// <reference path="../../internal/extension_repo/goja_plugin_types/core.d.ts" />

function init() {
    console.log("[Watch-History-Manager] Plugin initialized");

    // Cache anime collection whenever Seanime loads it to enrich history items with anime titles & covers
    $app.onGetAnimeCollection(function(e) {
        if (e.animeCollection) {
            $store.set("latestAnimeCollection", $clone(e.animeCollection));
        }
        e.next();
    });

    // Cache manga collection whenever Seanime loads it to enrich manga actions with titles & chapters
    $app.onGetMangaCollection(function(e) {
        if (e.mangaCollection) {
            $store.set("latestMangaCollection", $clone(e.mangaCollection));
        }
        e.next();
    });

    $ui.register(function(ctx) {
        console.log("[Watch-History-Manager] Registering UI components and context menu actions");

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

        // Helper: lookup anime metadata from AniList collection or cache
        function getAnimeMetadata(mediaId) {
            try {
                var collection = null;
                if (typeof $anilist !== "undefined" && typeof $anilist.getAnimeCollection === "function") {
                    try {
                        collection = $anilist.getAnimeCollection(false);
                    } catch (_) {}
                }
                if (!collection) {
                    collection = $store.get("latestAnimeCollection");
                }
                var lists = (collection && collection.MediaListCollection && collection.MediaListCollection.lists) || (collection && collection.lists) || [];
                for (var i = 0; i < lists.length; i++) {
                    var list = lists[i];
                    if (list && list.entries) {
                        for (var j = 0; j < list.entries.length; j++) {
                            var entry = list.entries[j];
                            if (entry && entry.media && entry.media.id === mediaId) {
                                var m = entry.media;
                                var title = String((m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || ("Anime #" + mediaId));
                                var coverRaw = (m.coverImage && (m.coverImage.large || m.coverImage.medium || m.coverImage.extraLarge));
                                var cover = coverRaw ? String(coverRaw) : "";
                                var progress = entry.progress || 0;
                                var episodes = m.episodes || 0;
                                var status = entry.status || null;
                                var repeat = entry.repeat || 0;
                                return { title: title, cover: cover, progress: progress, episodes: episodes, totalEpisodes: episodes, status: status, repeat: repeat };
                            }
                        }
                    }
                }
                if (typeof $anilist !== "undefined" && typeof $anilist.getAnime === "function") {
                    try {
                        var anime = $anilist.getAnime(mediaId);
                        if (anime) {
                            var directTitle = (anime.title && (anime.title.userPreferred || anime.title.romaji || anime.title.english)) || ("Anime #" + mediaId);
                            var directCover = (anime.coverImage && (anime.coverImage.large || anime.coverImage.medium || anime.coverImage.extraLarge)) || "";
                            var directEpisodes = anime.episodes || 0;
                            return { title: directTitle, cover: directCover, progress: 0, episodes: directEpisodes, totalEpisodes: directEpisodes, status: null, repeat: 0 };
                        }
                    } catch (_) {}
                }
            } catch (_) {}
            return { title: "Anime #" + mediaId, cover: "", progress: 0, episodes: 0, totalEpisodes: 0, status: null, repeat: 0 };
        }

        // Helper: lookup manga metadata from AniList collection or cache
        function getMangaMetadata(mediaId) {
            try {
                var collection = null;
                if (typeof $anilist !== "undefined" && typeof $anilist.getMangaCollection === "function") {
                    try {
                        collection = $anilist.getMangaCollection(false);
                    } catch (_) {}
                }
                if (!collection) {
                    collection = $store.get("latestMangaCollection");
                }
                var lists = (collection && collection.MediaListCollection && collection.MediaListCollection.lists) || (collection && collection.lists) || [];
                for (var i = 0; i < lists.length; i++) {
                    var list = lists[i];
                    if (list && list.entries) {
                        for (var j = 0; j < list.entries.length; j++) {
                            var entry = list.entries[j];
                            if (entry && entry.media && entry.media.id === mediaId) {
                                var m = entry.media;
                                var title = String((m.title && (m.title.userPreferred || m.title.romaji || m.title.english)) || ("Manga #" + mediaId));
                                var coverRaw = (m.coverImage && (m.coverImage.large || m.coverImage.medium || m.coverImage.extraLarge));
                                var cover = coverRaw ? String(coverRaw) : "";
                                var progress = entry.progress || 0;
                                var chapters = m.chapters || 0;
                                var status = entry.status || null;
                                var repeat = entry.repeat || 0;
                                return { title: title, cover: cover, progress: progress, chapters: chapters, status: status, repeat: repeat };
                            }
                        }
                    }
                }
                if (typeof $anilist !== "undefined" && typeof $anilist.getManga === "function") {
                    try {
                        var manga = $anilist.getManga(mediaId);
                        if (manga) {
                            var directMangaTitle = (manga.title && (manga.title.userPreferred || manga.title.romaji || manga.title.english)) || ("Manga #" + mediaId);
                            var directMangaCover = (manga.coverImage && (manga.coverImage.large || manga.coverImage.medium || manga.coverImage.extraLarge)) || "";
                            var directChapters = manga.chapters || 0;
                            return { title: directMangaTitle, cover: directMangaCover, progress: 0, chapters: directChapters, status: null, repeat: 0 };
                        }
                    } catch (_) {}
                }
            } catch (_) {}
            return { title: "Manga #" + mediaId, cover: "", progress: 0, chapters: 0, status: null, repeat: 0 };
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

        // ==========================================
        // ANIME ACTIONS
        // ==========================================

        // --- Action A1: Anime Page 3-dot Dropdown: "Mark Season as Watched" ---
        var animeDropdownMarkSeasonWatched = ctx.action.newAnimePageDropdownItem({
            label: "Mark Season as Watched"
        });
        animeDropdownMarkSeasonWatched.mount();
        animeDropdownMarkSeasonWatched.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Anime data not found");
                    return;
                }
                var meta = getAnimeMetadata(media.id);
                var targetEpisodes = media.episodes || meta.episodes || (meta.progress ? meta.progress + 1 : 1);
                $anilist.updateEntryProgress(media.id, targetEpisodes, targetEpisodes);
                $anilist.refreshAnimeCollection();
                try {
                    if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                        ctx.continuity.deleteWatchHistoryItem(media.id);
                    }
                } catch (e) {}
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Anime #" + media.id);
                ctx.toast.success("Marked entire season of " + title + " as watched (" + targetEpisodes + " eps)!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to mark season as watched: " + msg);
            }
        });

        // --- Action A2: Anime Page 3-dot Dropdown: "Mark Next Episode as Watched" ---
        var animeDropdownMarkNextEpWatched = ctx.action.newAnimePageDropdownItem({
            label: "Mark Next Episode as Watched"
        });
        animeDropdownMarkNextEpWatched.mount();
        animeDropdownMarkNextEpWatched.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Anime data not found");
                    return;
                }
                var meta = getAnimeMetadata(media.id);
                var nextEp = (meta.progress || 0) + 1;
                var totalEp = media.episodes || meta.episodes || undefined;
                $anilist.updateEntryProgress(media.id, nextEp, totalEp);
                $anilist.refreshAnimeCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Anime #" + media.id);
                ctx.toast.success("Updated " + title + ": Episode " + nextEp + " watched!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to update progress: " + msg);
            }
        });

        // --- Action A3: Anime Page Header Button: "Mark Ep Watched" ---
        var animePageButton = ctx.action.newAnimePageButton({
            label: "Mark Ep Watched",
            intent: "primary-subtle",
            tooltipText: "Mark next episode as watched on AniList"
        });
        animePageButton.mount();
        animePageButton.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Anime data not found");
                    return;
                }
                var meta = getAnimeMetadata(media.id);
                var nextEp = (meta.progress || 0) + 1;
                var totalEp = media.episodes || meta.episodes || undefined;
                $anilist.updateEntryProgress(media.id, nextEp, totalEp);
                $anilist.refreshAnimeCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Anime #" + media.id);
                ctx.toast.success("Updated " + title + ": Episode " + nextEp + " watched!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to update progress: " + msg);
            }
        });

        // --- Action A4: Episode Card Right-Click Menu: "Mark Episode as Watched" ---
        var episodeCardMarkWatched = ctx.action.newEpisodeCardContextMenuItem({
            label: "Mark Episode as Watched"
        });
        episodeCardMarkWatched.mount();
        episodeCardMarkWatched.onClick(function(event) {
            try {
                var ep = event && event.episode;
                if (!ep) {
                    ctx.toast.error("Episode data not found");
                    return;
                }
                var epNum = ep.progressNumber || ep.episodeNumber || 1;
                var mediaId = (ep.localFile && ep.localFile.mediaId) || null;
                if (!mediaId) {
                    ctx.toast.error("Anime media ID could not be identified");
                    return;
                }
                $anilist.updateEntryProgress(mediaId, epNum, undefined);
                $anilist.refreshAnimeCollection();
                ctx.toast.success("Marked Episode " + epNum + " as watched!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to mark episode as watched: " + msg);
            }
        });

        // --- Action A5: Media Card Right-Click Menu: "Mark Next Episode as Watched" ---
        var mediaCardMarkNextEp = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Next Episode as Watched",
            for: "anime"
        });
        mediaCardMarkNextEp.mount();
        mediaCardMarkNextEp.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Media data not found");
                    return;
                }
                var meta = getAnimeMetadata(media.id);
                var nextEp = (meta.progress || 0) + 1;
                var totalEp = media.episodes || meta.episodes || undefined;
                $anilist.updateEntryProgress(media.id, nextEp, totalEp);
                $anilist.refreshAnimeCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Anime #" + media.id);
                ctx.toast.success("Updated " + title + ": Episode " + nextEp + " watched!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to update progress: " + msg);
            }
        });

        // --- Action A6: Media Card Right-Click Menu: "Mark Season as Watched" ---
        var mediaCardMarkCompleted = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Season as Watched",
            for: "anime"
        });
        mediaCardMarkCompleted.mount();
        mediaCardMarkCompleted.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Media data not found");
                    return;
                }
                var meta = getAnimeMetadata(media.id);
                var targetEpisodes = media.episodes || meta.episodes || (meta.progress ? meta.progress + 1 : 1);
                $anilist.updateEntryProgress(media.id, targetEpisodes, targetEpisodes);
                $anilist.refreshAnimeCollection();
                try {
                    if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                        ctx.continuity.deleteWatchHistoryItem(media.id);
                    }
                } catch (e) {}
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Anime #" + media.id);
                ctx.toast.success("Marked entire season of " + title + " as watched (" + targetEpisodes + " eps)!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to mark season as watched: " + msg);
            }
        });

        // ==========================================
        // MANGA ACTIONS
        // ==========================================

        // --- Action M1: Manga Page 3-dot Dropdown: "Mark Manga / Season as Completed" ---
        var mangaDropdownMarkMangaRead = ctx.action.newMangaPageDropdownItem({
            label: "Mark Manga / Season as Completed"
        });
        mangaDropdownMarkMangaRead.mount();
        mangaDropdownMarkMangaRead.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Manga data not found");
                    return;
                }
                var meta = getMangaMetadata(media.id);
                var targetChapters = media.chapters || meta.chapters || (meta.progress ? meta.progress + 1 : 1);
                $anilist.updateEntryProgress(media.id, targetChapters, targetChapters);
                $anilist.refreshMangaCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Manga #" + media.id);
                ctx.toast.success("Marked " + title + " as Completed (" + targetChapters + " chapters)!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to mark manga as completed: " + msg);
            }
        });

        // --- Action M2: Manga Page 3-dot Dropdown: "Mark Next Chapter as Read" ---
        var mangaDropdownMarkNextChapterRead = ctx.action.newMangaPageDropdownItem({
            label: "Mark Next Chapter as Read"
        });
        mangaDropdownMarkNextChapterRead.mount();
        mangaDropdownMarkNextChapterRead.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Manga data not found");
                    return;
                }
                var meta = getMangaMetadata(media.id);
                var nextChap = (meta.progress || 0) + 1;
                var totalChap = media.chapters || meta.chapters || undefined;
                $anilist.updateEntryProgress(media.id, nextChap, totalChap);
                $anilist.refreshMangaCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Manga #" + media.id);
                ctx.toast.success("Updated " + title + ": Chapter " + nextChap + " read!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to update manga progress: " + msg);
            }
        });

        // --- Action M3: Manga Page Button: "Mark Chapter Read" ---
        var mangaPageButton = ctx.action.newMangaPageButton({
            label: "Mark Chapter Read",
            intent: "primary-subtle",
            tooltipText: "Quickly mark next chapter as read on AniList"
        });
        mangaPageButton.mount();
        mangaPageButton.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Manga data not found");
                    return;
                }
                var meta = getMangaMetadata(media.id);
                var nextChap = (meta.progress || 0) + 1;
                var totalChap = media.chapters || meta.chapters || undefined;
                $anilist.updateEntryProgress(media.id, nextChap, totalChap);
                $anilist.refreshMangaCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Manga #" + media.id);
                ctx.toast.success("Read Chapter " + nextChap + " of " + title);
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to update manga progress: " + msg);
            }
        });

        // --- Action M4: Media Card Right-Click Menu: "Mark Next Chapter as Read" ---
        var mediaCardMarkNextChapter = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Next Chapter as Read",
            for: "manga"
        });
        mediaCardMarkNextChapter.mount();
        mediaCardMarkNextChapter.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Manga data not found");
                    return;
                }
                var meta = getMangaMetadata(media.id);
                var nextChap = (meta.progress || 0) + 1;
                var totalChap = media.chapters || meta.chapters || undefined;
                $anilist.updateEntryProgress(media.id, nextChap, totalChap);
                $anilist.refreshMangaCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Manga #" + media.id);
                ctx.toast.success("Updated " + title + ": Chapter " + nextChap + " read!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to update manga progress: " + msg);
            }
        });

        // --- Action M5: Media Card Right-Click Menu: "Mark Manga as Completed" ---
        var mediaCardMarkMangaCompleted = ctx.action.newMediaCardContextMenuItem({
            label: "Mark Manga as Completed",
            for: "manga"
        });
        mediaCardMarkMangaCompleted.mount();
        mediaCardMarkMangaCompleted.onClick(function(event) {
            try {
                var media = event && event.media;
                if (!media || !media.id) {
                    ctx.toast.error("Manga data not found");
                    return;
                }
                var meta = getMangaMetadata(media.id);
                var targetChapters = media.chapters || meta.chapters || (meta.progress ? meta.progress + 1 : 1);
                $anilist.updateEntryProgress(media.id, targetChapters, targetChapters);
                $anilist.refreshMangaCollection();
                var title = (media.title && (media.title.userPreferred || media.title.romaji || media.title.english)) || meta.title || ("Manga #" + media.id);
                ctx.toast.success("Marked " + title + " as Completed (" + targetChapters + " chapters)!");
            } catch (err) {
                var msg = (err && err.message) ? err.message : String(err);
                ctx.toast.error("Failed to mark manga as completed: " + msg);
            }
        });

        // ==========================================
        // WATCH HISTORY TRAY DRAWER
        // ==========================================
        // WATCH HISTORY TRAY DRAWER
        // ==========================================
        var tray = ctx.newTray({
            iconUrl: "https://raw.githubusercontent.com/gametimeakhtab/seanime_extention/main/icon.png",
            withContent: true,
            width: "480px"
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

            // Sort strictly in descending order of actual watch timestamp (Most recently watched first)
            allItems.sort(function(a, b) {
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
                                                try {
                                                    $anilist.updateEntryProgress(mId, epNum, undefined);
                                                    $anilist.refreshAnimeCollection();
                                                    try {
                                                        if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                                                            ctx.continuity.deleteWatchHistoryItem(mId);
                                                        }
                                                    } catch (e) {}
                                                    ctx.toast.success("Marked Episode " + epNum + " as watched!");
                                                    tray.update();
                                                } catch (err) {
                                                    var msg = (err && err.message) ? err.message : String(err);
                                                    ctx.toast.error("Failed to mark episode as watched: " + msg);
                                                }
                                            })
                                        }),
                                        tray.button({
                                            label: "Mark Season Watched",
                                            size: "xs",
                                            intent: "gray-subtle",
                                            onClick: ctx.eventHandler("history-mark-season-" + mId, function() {
                                                try {
                                                    var totalEps = meta.episodes || epNum;
                                                    $anilist.updateEntryProgress(mId, totalEps, totalEps);
                                                    $anilist.refreshAnimeCollection();
                                                    try {
                                                        if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                                                            ctx.continuity.deleteWatchHistoryItem(mId);
                                                        }
                                                    } catch (e) {}
                                                    ctx.toast.success("Marked entire season of " + title + " as watched (" + totalEps + " eps)!");
                                                    tray.update();
                                                } catch (err) {
                                                    var msg = (err && err.message) ? err.message : String(err);
                                                    ctx.toast.error("Failed to mark season as watched: " + msg);
                                                }
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
                                            label: "Remove",
                                            size: "xs",
                                            intent: "alert-subtle",
                                            onClick: ctx.eventHandler("history-remove-" + mId, function() {
                                                try {
                                                    if (ctx.continuity && typeof ctx.continuity.deleteWatchHistoryItem === "function") {
                                                        ctx.continuity.deleteWatchHistoryItem(mId);
                                                        ctx.toast.info("Removed from watch history");
                                                        tray.update();
                                                    } else {
                                                        ctx.toast.error("Continuity API unavailable");
                                                    }
                                                } catch (err) {
                                                    var msg = (err && err.message) ? err.message : String(err);
                                                    ctx.toast.error("Failed to remove: " + msg);
                                                }
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

