import { NextResponse } from 'next/server';
import { TemplateService } from '@/lib/landing-zone-templates';

/**
 * GET /api/landing-zone/templates
 * Returns all available landing zone templates
 */
export async function GET() {
  try {
    const templates = TemplateService.getTemplates();

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Failed to get templates:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve templates',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
