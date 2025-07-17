import { Test, TestingModule } from '@nestjs/testing';
import { RoomsGatewayGateway } from './rooms-gateway.gateway';

describe('RoomsGatewayGateway', () => {
  let gateway: RoomsGatewayGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomsGatewayGateway],
    }).compile();

    gateway = module.get<RoomsGatewayGateway>(RoomsGatewayGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
