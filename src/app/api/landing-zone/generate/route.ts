import { NextRequest, NextResponse } from 'next/server';
import { BicepGenerator, LandingZoneRequest } from '@/lib/bicep-generator';
import { LandingZoneValidator } from '@/lib/landing-zone-validator';

/**
 * POST /api/landing-zone/generate
 * Generates a Bicep parameter file from landing zone request
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestBody: LandingZoneRequest = await request.json();
    
    // Add request metadata
    const requestWithMetadata = {
      ...requestBody,
      requestedBy: request.headers.get('x-user-email') || 'unknown',
      requestedDate: new Date().toISOString(),
    };

    // Validate the request
    const validation = LandingZoneValidator.validateRequest(requestWithMetadata);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Generate Bicep parameter file
    const bicepContent = BicepGenerator.generateBicepParam(requestWithMetadata);
    const fileName = BicepGenerator.generateFileName(requestWithMetadata);

    // Validate generated bicep content
    const bicepValidation = BicepGenerator.validate(bicepContent);
    if (!bicepValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to generate valid Bicep parameter file',
          errors: bicepValidation.errors,
        },
        { status: 500 }
      );
    }

    // Return the generated content for download
    return NextResponse.json({
      success: true,
      message: 'Bicep parameter file generated successfully',
      data: {
        fileName,
        content: bicepContent,
        landingZoneName: requestBody.landingZoneName,
        environment: requestBody.environment,
        templateType: requestBody.templateType,
      },
    });
  } catch (error) {
    console.error('Unexpected error in generate:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
