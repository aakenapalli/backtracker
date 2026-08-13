import { SiteRepository } from "../repositories/site.repository.ts";
import type { GetSitesResponseDto } from "../types/api.ts";

export class SiteController {
  private readonly siteRepository: SiteRepository;

  constructor(siteRepository = new SiteRepository()) {
    this.siteRepository = siteRepository;
  }

  async listSites(): Promise<GetSitesResponseDto> {
    const allSites = await this.siteRepository.getAllSites("istanbul");
    const sites = allSites.map((site) => ({
      slug: site.slug,
      name: site.name,
      neighborhood: site.neighborhood,
      themes: site.themes.map((theme) => theme.slug),
      editorialPriority: site.editorialPriority,
    }));

    return { sites };
  }
}

